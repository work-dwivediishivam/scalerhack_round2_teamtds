from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import matplotlib.pyplot as plt


def main() -> None:
    metrics_path = Path("results/baseline_metrics.json")
    if not metrics_path.exists():
        raise SystemExit("Run scripts/evaluate_baselines.py first")
    rows = json.loads(metrics_path.read_text(encoding="utf-8"))
    out_dir = Path("results/plots")
    out_dir.mkdir(parents=True, exist_ok=True)

    for metric in ["total_reward", "total_dep_delay", "stranded_passengers", "avg_satisfaction"]:
        grouped = defaultdict(list)
        for row in rows:
            grouped[(row["stage"], row["policy"])].append(row[metric])
        labels = []
        values = []
        for key in sorted(grouped):
            stage, policy = key
            labels.append(f"S{stage}\n{policy}")
            values.append(sum(grouped[key]) / len(grouped[key]))
        plt.figure(figsize=(12, 5))
        plt.bar(labels, values, color=["#1f77b4", "#ff7f0e", "#2ca02c"] * 3)
        plt.title(f"Runway Zero baseline comparison: {metric}")
        plt.ylabel(metric)
        plt.xticks(rotation=35, ha="right")
        plt.tight_layout()
        plt.savefig(out_dir / f"{metric}.png", dpi=180)
        plt.close()
    print(f"Wrote plots to {out_dir}")


if __name__ == "__main__":
    main()

