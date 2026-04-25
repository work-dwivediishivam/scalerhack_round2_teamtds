"""Evaluate hosted/provider models as Runway Zero planners."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, List

from huggingface_hub import InferenceClient

from runway_zero.simulator import RunwayZeroEnv

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from llm_rollout_template import observation_to_prompt, parse_actions  # noqa: E402

MODEL_ALIASES = {
    "gemma": "google/gemma-4-31B-it",
    "gpt-oss": "openai/gpt-oss-120b",
    "qwen-coder": "Qwen/Qwen2.5-Coder-7B-Instruct",
    "qwen3": "Qwen/Qwen3-14B",
}


def complete(client: InferenceClient, model: str, prompt: str, max_tokens: int) -> str:
    response = client.chat_completion(
        model=model,
        messages=[
            {"role": "system", "content": "Return only valid JSON. No markdown. No explanation."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=max_tokens,
        temperature=0.2,
    )
    return response.choices[0].message.content or "[]"


def rollout_model(model: str, stage: int, seed: int, max_steps: int, max_tokens: int) -> dict[str, Any]:
    client = InferenceClient(token=os.getenv("HF_TOKEN"))
    env = RunwayZeroEnv(stage=stage, seed=seed)
    total_reward = 0.0
    raw_generations: List[dict[str, Any]] = []
    steps = 0
    while not env.done and steps < max_steps:
        observation = env.observation()
        if not observation["pending_decisions"]:
            result = env.step([])
        else:
            prompt = observation_to_prompt(observation)
            text = complete(client, model, prompt, max_tokens=max_tokens)
            actions = parse_actions(text)
            result = env.step(actions)
            raw_generations.append(
                {
                    "time": env.time,
                    "completion": text,
                    "parsed_actions": actions,
                    "reward": result.reward,
                }
            )
        total_reward += result.reward
        steps += 1
    return {
        "policy": f"hosted_{model.replace('/', '_')}",
        "model": model,
        "stage": stage,
        "seed": seed,
        "total_reward": round(total_reward, 3),
        "metrics": env.metrics(),
        "history": env.history,
        "raw_generations": raw_generations,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="Qwen/Qwen2.5-Coder-7B-Instruct")
    parser.add_argument("--stage", type=int, default=1)
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--max-steps", type=int, default=8)
    parser.add_argument("--max-tokens", type=int, default=512)
    parser.add_argument("--out-dir", default="results/hosted_model_rollouts")
    args = parser.parse_args()

    model = MODEL_ALIASES.get(args.model, args.model)
    result = rollout_model(model, args.stage, args.seed, args.max_steps, args.max_tokens)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{result['policy']}_stage{args.stage}_seed{args.seed}.json"
    out_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(
        json.dumps(
            {"out": str(out_path), "total_reward": result["total_reward"], "metrics": result["metrics"]},
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

