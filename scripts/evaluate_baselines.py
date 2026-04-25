from __future__ import annotations

import json
from pathlib import Path

from runway_zero.baselines import FifoPolicy, RandomPolicy, RecoveryPolicy, rollout


def main() -> None:
    out_dir = Path("results")
    out_dir.mkdir(exist_ok=True)
    seeds = [7, 11, 17]
    policies = [RandomPolicy(1), FifoPolicy(), RecoveryPolicy()]
    rows = []
    for stage in [1, 2, 3]:
        for seed in seeds:
            for policy in policies:
                result = rollout(policy, stage=stage, seed=seed)
                metrics = result["metrics"]
                rows.append(
                    {
                        "policy": result["policy"],
                        "stage": stage,
                        "seed": seed,
                        "total_reward": result["total_reward"],
                        "flights_arrived": metrics["flights_arrived"],
                        "flights_cancelled": metrics["flights_cancelled"],
                        "total_dep_delay": metrics["total_dep_delay"],
                        "total_arr_delay": metrics["total_arr_delay"],
                        "stranded_passengers": metrics["stranded_passengers"],
                        "avg_satisfaction": metrics["avg_satisfaction"],
                    }
                )
    (out_dir / "baseline_metrics.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print(json.dumps(rows, indent=2))


if __name__ == "__main__":
    main()

