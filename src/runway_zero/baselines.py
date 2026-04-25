from __future__ import annotations

import random
from typing import Any, Dict, List, Protocol

from runway_zero.qlearning import TrainedRLPolicy
from runway_zero.simulator import RunwayZeroEnv


class Policy(Protocol):
    name: str

    def act(self, env: RunwayZeroEnv, observation: Dict[str, Any]) -> List[Dict[str, Any]]:
        ...


class RandomPolicy:
    name = "random"

    def __init__(self, seed: int = 0):
        self.rng = random.Random(seed)

    def act(self, env: RunwayZeroEnv, observation: Dict[str, Any]) -> List[Dict[str, Any]]:
        actions = []
        for decision in observation["pending_decisions"][:5]:
            roll = self.rng.random()
            if roll < 0.55:
                actions.append({"action": "depart", "flight_id": decision["flight_id"]})
            elif roll < 0.85:
                actions.append(
                    {
                        "action": "hold",
                        "flight_id": decision["flight_id"],
                        "minutes": self.rng.choice([15, 30, 45]),
                        "reason": "random baseline hold",
                    }
                )
            else:
                actions.append(
                    {
                        "action": "cancel",
                        "flight_id": decision["flight_id"],
                        "reason": "random baseline cancellation",
                    }
                )
        return actions


class FifoPolicy:
    name = "fifo"

    def act(self, env: RunwayZeroEnv, observation: Dict[str, Any]) -> List[Dict[str, Any]]:
        actions = []
        for decision in sorted(
            observation["pending_decisions"],
            key=lambda item: (item["scheduled_dep"], -item["delay_minutes"]),
        )[:8]:
            if decision["aircraft_ready"] and decision["crew_ready"]:
                actions.append({"action": "depart", "flight_id": decision["flight_id"]})
            else:
                actions.append(
                    {
                        "action": "hold",
                        "flight_id": decision["flight_id"],
                        "minutes": 15,
                        "reason": "waiting for aircraft or crew",
                    }
                )
        return actions


class RecoveryPolicy:
    """Human-designed policy used as a stand-in for a trained recovery controller.

    It is deliberately simple: protect high-impact passengers, swap broken aircraft when
    possible, depart ready flights, and cancel only when delay becomes unrecoverable.
    The TRL notebook uses this policy to generate warm-start traces and comparison data.
    """

    name = "recovery_heuristic"

    def act(self, env: RunwayZeroEnv, observation: Dict[str, Any]) -> List[Dict[str, Any]]:
        actions = []
        pending = sorted(
            observation["pending_decisions"],
            key=lambda item: (
                -int(item["priority"] == "emergency"),
                -int(item["delay_minutes"] > 90),
                item["scheduled_dep"],
            ),
        )
        for decision in pending[:10]:
            flight = env.flights[decision["flight_id"]]
            if env.stage >= 2:
                actions.append({"action": "protect_connection", "flight_id": flight.flight_id})
            if env.stage >= 3 and decision["delay_minutes"] > 60:
                actions.append(
                    {
                        "action": "negotiate_slot",
                        "flight_id": flight.flight_id,
                        "bid": 9000,
                        "promise": "delay and passenger protection",
                    }
                )
            if env.stage >= 3 and decision["delay_minutes"] > 105:
                actions.append(
                    {
                        "action": "allocate_compensation",
                        "flight_id": flight.flight_id,
                        "amount": 1500,
                    }
                )
            if not decision["aircraft_ready"]:
                replacement = env.find_available_aircraft(flight)
                if replacement is not None and replacement.aircraft_id != flight.aircraft_id:
                    actions.append(
                        {
                            "action": "swap_aircraft",
                            "flight_id": flight.flight_id,
                            "aircraft_id": replacement.aircraft_id,
                        }
                    )
                elif env.stage >= 2:
                    actions.append({"action": "request_maintenance", "flight_id": flight.flight_id})
            if decision["aircraft_ready"] and decision["crew_ready"]:
                actions.append({"action": "depart", "flight_id": flight.flight_id})
            elif decision["delay_minutes"] > 180:
                actions.append(
                    {
                        "action": "cancel",
                        "flight_id": flight.flight_id,
                        "reason": "delay exceeded recovery threshold",
                    }
                )
            else:
                hold_minutes = 15 if decision["delay_minutes"] < 60 else 30
                actions.append(
                    {
                        "action": "hold",
                        "flight_id": flight.flight_id,
                        "minutes": hold_minutes,
                        "reason": "controlled recovery hold",
                    }
                )
        return actions


POLICIES = {
    "random": RandomPolicy,
    "fifo": FifoPolicy,
    "recovery_heuristic": RecoveryPolicy,
    "trained_rl": TrainedRLPolicy,
}


def rollout(policy: Policy, stage: int, seed: int) -> Dict[str, Any]:
    env = RunwayZeroEnv(stage=stage, seed=seed)
    total_reward = 0.0
    while not env.done:
        observation = env.observation()
        result = env.step(policy.act(env, observation))
        total_reward += result.reward
    metrics = env.metrics()
    return {
        "policy": policy.name,
        "stage": stage,
        "seed": seed,
        "total_reward": round(total_reward, 3),
        "metrics": metrics,
        "history": env.history,
    }
