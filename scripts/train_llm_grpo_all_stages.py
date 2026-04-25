"""Full LLM RL training entrypoint for Runway Zero.

This is the GPU/Hugging Face training path. It trains on environment-generated
prompts and computes rewards by executing the model's JSON actions inside
RunwayZeroEnv.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Iterable, List

from runway_zero.simulator import RunwayZeroEnv

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from llm_rollout_template import observation_to_prompt, parse_actions  # noqa: E402


def build_training_examples(
    stages: Iterable[int], seeds: Iterable[int], warmup_horizon: int
) -> List[dict[str, Any]]:
    examples: List[dict[str, Any]] = []
    for stage in stages:
        for seed in seeds:
            env = RunwayZeroEnv(stage=stage, seed=seed)
            for warmup in range(warmup_horizon):
                env.step([])
                obs = env.observation()
                if obs["pending_decisions"]:
                    examples.append(
                        {
                            "prompt": observation_to_prompt(obs),
                            "stage": stage,
                            "seed": seed,
                            "warmup_steps": warmup + 1,
                        }
                    )
    return examples


def make_reward_func() -> Any:
    def runway_reward(completions: List[str], **kwargs: Any) -> List[float]:
        stages = kwargs.get("stage") or [1] * len(completions)
        seeds = kwargs.get("seed") or [7 + index for index in range(len(completions))]
        warmups = kwargs.get("warmup_steps") or [8] * len(completions)
        rewards: List[float] = []
        for completion, stage, seed, warmup in zip(completions, stages, seeds, warmups):
            env = RunwayZeroEnv(stage=int(stage), seed=int(seed))
            for _ in range(int(warmup)):
                env.step([])
            actions = parse_actions(completion)
            result = env.step(actions)
            rewards.append(float(result.reward))
        return rewards

    return runway_reward


def load_model(model_name: str, use_unsloth: bool) -> tuple[Any, Any]:
    if use_unsloth:
        try:
            from unsloth import FastLanguageModel

            model, tokenizer = FastLanguageModel.from_pretrained(
                model_name=model_name,
                max_seq_length=4096,
                load_in_4bit=True,
                token=os.getenv("HF_TOKEN"),
            )
            model = FastLanguageModel.get_peft_model(
                model,
                r=16,
                target_modules=[
                    "q_proj",
                    "k_proj",
                    "v_proj",
                    "o_proj",
                    "gate_proj",
                    "up_proj",
                    "down_proj",
                ],
                lora_alpha=16,
                lora_dropout=0,
                bias="none",
                use_gradient_checkpointing="unsloth",
            )
            return model, tokenizer
        except Exception as exc:
            print(f"Unsloth unavailable or failed ({exc}); falling back to Transformers.")

    from transformers import AutoModelForCausalLM, AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(model_name, token=os.getenv("HF_TOKEN"))
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    if os.getenv("RUNWAY_ZERO_LOAD_IN_4BIT") == "1":
        import torch
        from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
        from transformers import BitsAndBytesConfig

        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            token=os.getenv("HF_TOKEN"),
            device_map="auto",
            quantization_config=quantization_config,
        )
        model = prepare_model_for_kbit_training(model)
        model = get_peft_model(
            model,
            LoraConfig(
                r=16,
                lora_alpha=32,
                lora_dropout=0.05,
                bias="none",
                task_type="CAUSAL_LM",
                target_modules=[
                    "q_proj",
                    "k_proj",
                    "v_proj",
                    "o_proj",
                    "gate_proj",
                    "up_proj",
                    "down_proj",
                ],
            ),
        )
    else:
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            token=os.getenv("HF_TOKEN"),
            device_map="auto",
            torch_dtype="auto",
        )
    return model, tokenizer


def train(args: argparse.Namespace) -> None:
    seeds = list(range(args.seed_start, args.seed_start + args.seed_count))
    examples = build_training_examples(args.stages, seeds, args.warmup_horizon)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "training_examples.json").write_text(json.dumps(examples, indent=2), encoding="utf-8")

    if args.dry_run:
        print(json.dumps({"examples": len(examples), "sample": examples[0]}, indent=2)[:4000])
        return

    from datasets import Dataset
    from trl import GRPOConfig, GRPOTrainer

    dataset = Dataset.from_list(examples)
    model, tokenizer = load_model(args.model, args.use_unsloth)
    config = GRPOConfig(
        output_dir=str(output_dir),
        max_steps=args.max_steps,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.learning_rate,
        logging_steps=1,
        save_steps=max(10, args.max_steps // 3),
        num_generations=args.num_generations,
        generation_batch_size=args.num_generations * args.batch_size,
        max_prompt_length=args.max_prompt_length,
        max_completion_length=args.max_completion_length,
    )
    trainer = GRPOTrainer(
        model=model,
        processing_class=tokenizer,
        args=config,
        train_dataset=dataset,
        reward_funcs=make_reward_func(),
    )
    trainer.train()
    trainer.save_model(str(output_dir / "final_adapter"))
    (output_dir / "run_summary.json").write_text(
        json.dumps(
            {
                "model": args.model,
                "stages": args.stages,
                "max_steps": args.max_steps,
                "examples": len(examples),
                "output_dir": str(output_dir),
            },
            indent=2,
        ),
        encoding="utf-8",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="Qwen/Qwen2.5-Coder-7B-Instruct")
    parser.add_argument("--stages", nargs="+", type=int, default=[1, 2, 3])
    parser.add_argument("--seed-start", type=int, default=101)
    parser.add_argument("--seed-count", type=int, default=8)
    parser.add_argument("--warmup-horizon", type=int, default=24)
    parser.add_argument("--output-dir", default="results/llm_runs/runway_zero_grpo")
    parser.add_argument("--max-steps", type=int, default=60)
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--grad-accum", type=int, default=4)
    parser.add_argument("--learning-rate", type=float, default=5e-6)
    parser.add_argument("--num-generations", type=int, default=4)
    parser.add_argument("--max-prompt-length", type=int, default=3072)
    parser.add_argument("--max-completion-length", type=int, default=512)
    parser.add_argument("--use-unsloth", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


if __name__ == "__main__":
    train(parse_args())
