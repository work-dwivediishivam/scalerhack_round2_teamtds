from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any, Dict, List, Tuple

from runway_zero.simulator import RunwayZeroEnv

QTable = Dict[str, Dict[str, float]]

ACTIONS = [
    "depart",
    "hold_15",
    "hold_30",
    "protect_then_depart",
    "protect_then_hold",
    "swap_then_depart",
    "cancel_if_late",
]


def state_key(stage: int, decision: Dict[str, Any], active_disruptions: int) -> str:
    delay = int(decision["delay_minutes"])
    if delay < 15:
        delay_bucket = "d0"
    elif delay < 45:
        delay_bucket = "d1"
    elif delay < 90:
        delay_bucket = "d2"
    elif delay < 150:
        delay_bucket = "d3"
    else:
        delay_bucket = "d4"
    ready = f"a{int(decision['aircraft_ready'])}c{int(decision['crew_ready'])}"
    weather = "w1" if decision["weather_delay"] > 0 else "w0"
    priority = "p1" if decision["priority"] == "emergency" else "p0"
    disruption = "x2" if active_disruptions >= 2 else f"x{active_disruptions}"
    passenger = "m2" if decision["passengers"] >= 150 else ("m1" if decision["passengers"] >= 100 else "m0")
    return "|".join([f"s{stage}", delay_bucket, ready, weather, priority, disruption, passenger])


def q_action_to_env_actions(action: str, env: RunwayZeroEnv, flight_id: str) -> List[Dict[str, Any]]:
    flight = env.flights[flight_id]
    if action == "depart":
        return [{"action": "depart", "flight_id": flight_id}]
    if action == "hold_15":
        return [{"action": "hold", "flight_id": flight_id, "minutes": 15, "reason": "RL controlled hold"}]
    if action == "hold_30":
        return [{"action": "hold", "flight_id": flight_id, "minutes": 30, "reason": "RL congestion hold"}]
    if action == "protect_then_depart":
        return [
            {"action": "protect_connection", "flight_id": flight_id},
            {"action": "depart", "flight_id": flight_id},
        ]
    if action == "protect_then_hold":
        return [
            {"action": "protect_connection", "flight_id": flight_id},
            {"action": "hold", "flight_id": flight_id, "minutes": 15, "reason": "RL protects passengers"},
        ]
    if action == "swap_then_depart":
        replacement = env.find_available_aircraft(flight)
        if replacement is None or replacement.aircraft_id == flight.aircraft_id:
            return [{"action": "hold", "flight_id": flight_id, "minutes": 15, "reason": "RL swap unavailable"}]
        return [
            {
                "action": "swap_aircraft",
                "flight_id": flight_id,
                "aircraft_id": replacement.aircraft_id,
            },
            {"action": "depart", "flight_id": flight_id},
        ]
    if action == "cancel_if_late":
        if flight.dep_delay(env.time) >= 150:
            return [{"action": "cancel", "flight_id": flight_id, "reason": "RL late cancellation"}]
        return [{"action": "hold", "flight_id": flight_id, "minutes": 30, "reason": "RL avoids early cancel"}]
    return [{"action": "hold", "flight_id": flight_id, "minutes": 15, "reason": "RL fallback"}]


class TrainedRLPolicy:
    name = "trained_rl"

    def __init__(self, q_table: QTable | None = None, max_decisions: int = 12):
        self.q_table = q_table or {}
        self.max_decisions = max_decisions

    @classmethod
    def from_file(cls, path: str | Path) -> "TrainedRLPolicy":
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
        return cls(payload["q_table"])

    def act(self, env: RunwayZeroEnv, observation: Dict[str, Any]) -> List[Dict[str, Any]]:
        actions: List[Dict[str, Any]] = []
        active_count = len(observation["active_disruptions"])
        pending = sorted(
            observation["pending_decisions"],
            key=lambda item: (
                -int(item["priority"] == "emergency"),
                -item["delay_minutes"],
                item["scheduled_dep"],
            ),
        )
        for decision in pending[: self.max_decisions]:
            key = state_key(env.stage, decision, active_count)
            choices = self.q_table.get(key, {})
            if not choices:
                action = _fallback_action(decision)
            else:
                action, value = max(choices.items(), key=lambda item: item[1])
                if value < 0:
                    action = _fallback_action(decision)
            actions.extend(q_action_to_env_actions(action, env, decision["flight_id"]))
        return actions


def train_stage(
    stage: int,
    episodes: int = 180,
    seed: int = 123,
    alpha: float = 0.25,
    gamma: float = 0.92,
    epsilon_start: float = 0.55,
    epsilon_end: float = 0.08,
) -> Dict[str, Any]:
    rng = random.Random(seed + stage)
    q_table: QTable = {}
    curve = []
    for episode in range(episodes):
        env = RunwayZeroEnv(stage=stage, seed=seed + episode)
        epsilon = epsilon_end + (epsilon_start - epsilon_end) * max(0.0, 1.0 - episode / episodes)
        total_reward = 0.0
        while not env.done:
            obs = env.observation()
            active_count = len(obs["active_disruptions"])
            pending = obs["pending_decisions"][:12]
            chosen: List[Tuple[str, str]] = []
            env_actions: List[Dict[str, Any]] = []
            for decision in pending:
                key = state_key(stage, decision, active_count)
                q_table.setdefault(key, _prior_q_values(decision))
                if rng.random() < epsilon:
                    action = rng.choice(ACTIONS)
                else:
                    action = max(q_table[key].items(), key=lambda item: item[1])[0]
                chosen.append((key, action))
                env_actions.extend(q_action_to_env_actions(action, env, decision["flight_id"]))
            result = env.step(env_actions)
            total_reward += result.reward
            future_values = []
            next_obs = result.observation
            for decision in next_obs["pending_decisions"][:12]:
                next_key = state_key(stage, decision, len(next_obs["active_disruptions"]))
                if next_key in q_table:
                    future_values.append(max(q_table[next_key].values()))
            target = result.reward + gamma * (max(future_values) if future_values else 0.0)
            for key, action in chosen:
                old = q_table[key][action]
                q_table[key][action] = old + alpha * (target - old)
        curve.append({"episode": episode + 1, "reward": round(total_reward, 3)})
    return {
        "stage": stage,
        "episodes": episodes,
        "seed": seed,
        "actions": ACTIONS,
        "q_table": q_table,
        "learning_curve": curve,
    }


def _fallback_action(decision: Dict[str, Any]) -> str:
    if decision["aircraft_ready"] and decision["crew_ready"]:
        return "protect_then_depart" if decision["delay_minutes"] > 30 else "depart"
    if decision["delay_minutes"] > 150:
        return "cancel_if_late"
    return "hold_15"


def _prior_q_values(decision: Dict[str, Any]) -> Dict[str, float]:
    values = {action: -2.0 for action in ACTIONS}
    fallback = _fallback_action(decision)
    values[fallback] = 8.0
    if decision["aircraft_ready"] and decision["crew_ready"]:
        values["depart"] = max(values["depart"], 6.0)
        if decision["delay_minutes"] > 30:
            values["protect_then_depart"] = max(values["protect_then_depart"], 9.0)
    if not decision["aircraft_ready"]:
        values["swap_then_depart"] = max(values["swap_then_depart"], 5.0)
    if decision["delay_minutes"] > 90:
        values["hold_30"] = max(values["hold_30"], 2.0)
    if decision["delay_minutes"] > 150:
        values["cancel_if_late"] = max(values["cancel_if_late"], 4.0)
    return values
