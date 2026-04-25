"""Minimal TRL/GRPO training scaffold for Runway Zero.

This script is intentionally lightweight and Colab-oriented. Full model training
should be run during the hackathon compute window with an available GPU.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import List

from runway_zero.simulator import RunwayZeroEnv

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from llm_rollout_template import observation_to_prompt, parse_actions  # noqa: E402


def build_prompts(stage: int = 1, seeds: List[int] | None = None) -> List[str]:
    prompts = []
    for seed in seeds or [7, 11, 17, 23]:
        env = RunwayZeroEnv(stage=stage, seed=seed)
        for _ in range(8):
            env.step([])
            obs = env.observation()
            if obs["pending_decisions"]:
                prompts.append(observation_to_prompt(obs))
    return prompts


def runway_reward(completions: List[str], prompts: List[str] | None = None) -> List[float]:
    rewards = []
    for index, completion in enumerate(completions):
        env = RunwayZeroEnv(stage=1, seed=7 + index)
        for _ in range(8):
            env.step([])
        actions = parse_actions(completion)
        result = env.step(actions)
        rewards.append(float(result.reward))
    return rewards


def main() -> None:
    prompts = build_prompts()
    print(json.dumps({"prompt_count": len(prompts), "sample_prompt": prompts[0][:1200]}, indent=2))
    print("To train: load these prompts into TRL GRPOTrainer and pass runway_reward as reward_func.")

    # Colab/GPU sketch:
    #
    # from datasets import Dataset
    # from trl import GRPOConfig, GRPOTrainer
    # from transformers import AutoModelForCausalLM, AutoTokenizer
    #
    # dataset = Dataset.from_dict({"prompt": prompts})
    # model_name = "Qwen/Qwen2.5-Coder-7B-Instruct"
    # tokenizer = AutoTokenizer.from_pretrained(model_name)
    # model = AutoModelForCausalLM.from_pretrained(model_name, device_map="auto")
    # config = GRPOConfig(output_dir="runway-zero-stage1", num_train_epochs=1)
    # trainer = GRPOTrainer(model=model, args=config, train_dataset=dataset, reward_funcs=runway_reward)
    # trainer.train()


if __name__ == "__main__":
    main()
