from __future__ import annotations

import json
from pathlib import Path

from runway_zero.baselines import FifoPolicy, RecoveryPolicy, rollout


def main() -> None:
    trace_dir = Path("results/traces")
    trace_dir.mkdir(parents=True, exist_ok=True)
    for policy in [FifoPolicy(), RecoveryPolicy()]:
        result = rollout(policy, stage=2, seed=7)
        payload = {
            "title": "Runway Zero Demo Replay",
            "policy": result["policy"],
            "stage": result["stage"],
            "seed": result["seed"],
            "summary": result["metrics"],
            "frames": result["history"],
        }
        (trace_dir / f"{result['policy']}_stage2_seed7.json").write_text(
            json.dumps(payload, indent=2), encoding="utf-8"
        )
    print(f"Wrote traces to {trace_dir}")


if __name__ == "__main__":
    main()
