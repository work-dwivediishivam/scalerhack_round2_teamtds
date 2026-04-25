from __future__ import annotations

import json
from pathlib import Path

from runway_zero.qlearning import train_stage


def main() -> None:
    out_dir = Path("results/trained")
    out_dir.mkdir(parents=True, exist_ok=True)
    episodes_by_stage = {1: 140, 2: 180, 3: 220}
    summary = []
    for stage, episodes in episodes_by_stage.items():
        artifact = train_stage(stage=stage, episodes=episodes)
        path = out_dir / f"q_policy_stage{stage}.json"
        path.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
        rewards = [point["reward"] for point in artifact["learning_curve"]]
        summary.append(
            {
                "stage": stage,
                "episodes": episodes,
                "first_20_avg": round(sum(rewards[:20]) / max(1, min(20, len(rewards))), 3),
                "last_20_avg": round(sum(rewards[-20:]) / max(1, min(20, len(rewards))), 3),
                "artifact": str(path),
            }
        )
    (out_dir / "training_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
