from __future__ import annotations

import json
import os
from typing import Any, Dict, List

from runway_zero.simulator import RunwayZeroEnv


SYSTEM_PROMPT = """You are Runway Zero, an airport operations recovery agent.
Return only a JSON array of actions. Valid action names are depart, hold,
cancel, swap_aircraft, and protect_connection. Safety is more important than
delay, passenger outcomes are more important than airline convenience."""


def observation_to_prompt(observation: Dict[str, Any]) -> str:
    compact = {
        "clock": observation["clock"],
        "stage": observation["stage"],
        "active_disruptions": observation["active_disruptions"],
        "pending_decisions": observation["pending_decisions"][:12],
        "network_summary": observation["network_summary"],
        "action_schema": observation["action_schema"],
    }
    return SYSTEM_PROMPT + "\n\nObservation:\n" + json.dumps(compact, indent=2)


def parse_actions(text: str) -> List[Dict[str, Any]]:
    try:
        start = text.index("[")
        end = text.rindex("]") + 1
        parsed = json.loads(text[start:end])
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def local_demo_prompt() -> None:
    env = RunwayZeroEnv(stage=1, seed=7)
    for _ in range(5):
        env.step([])
    print(observation_to_prompt(env.observation()))


if __name__ == "__main__":
    if not os.getenv("HF_TOKEN"):
        print("HF_TOKEN not set; printing a local rollout prompt instead.")
    local_demo_prompt()

