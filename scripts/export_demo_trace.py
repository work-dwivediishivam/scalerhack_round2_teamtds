from __future__ import annotations

import json
from pathlib import Path

from runway_zero.baselines import FifoPolicy, RandomPolicy, RecoveryPolicy, rollout
from runway_zero.qlearning import TrainedRLPolicy


def main() -> None:
    trace_dir = Path("results/traces")
    trace_dir.mkdir(parents=True, exist_ok=True)
    summaries = []
    for stage in [1, 2, 3]:
        trained_path = Path(f"results/trained/q_policy_stage{stage}.json")
        policies = [RandomPolicy(2), FifoPolicy(), RecoveryPolicy()]
        if trained_path.exists():
            policies.append(TrainedRLPolicy.from_file(trained_path))
        for policy in policies:
            result = rollout(policy, stage=stage, seed=7)
            payload = {
                "title": "Runway Zero Demo Replay",
                "policy": result["policy"],
                "stage": result["stage"],
                "seed": result["seed"],
                "summary": result["metrics"],
                "total_reward": result["total_reward"],
                "frames": result["history"],
            }
            name = f"{result['policy']}_stage{stage}_seed7.json"
            (trace_dir / name).write_text(json.dumps(payload, indent=2), encoding="utf-8")
            summaries.append(
                {
                    "trace": name,
                    "policy": result["policy"],
                    "stage": stage,
                    "total_reward": result["total_reward"],
                    **result["metrics"],
                }
            )
    (trace_dir / "trace_manifest.json").write_text(json.dumps(summaries, indent=2), encoding="utf-8")
    print(f"Wrote traces to {trace_dir}")


if __name__ == "__main__":
    main()
