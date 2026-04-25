from __future__ import annotations

from dataclasses import asdict
from typing import Any, Dict, Iterable, List, Optional

from runway_zero.models import Aircraft, Crew, Flight, RewardBreakdown, StepResult
from runway_zero.scenarios import build_scenario


class RunwayZeroEnv:
    """Deterministic airport recovery environment.

    The API follows the Gym/OpenEnv mental model:
    - reset(stage, seed) -> observation
    - step(actions) -> observation, reward, done, info
    - state() -> full serializable state
    """

    def __init__(self, stage: int = 1, seed: int = 7, step_minutes: int = 15):
        self.stage = stage
        self.seed = seed
        self.step_minutes = step_minutes
        self.reset(stage=stage, seed=seed)

    def reset(self, stage: Optional[int] = None, seed: Optional[int] = None) -> Dict[str, Any]:
        if stage is not None:
            self.stage = stage
        if seed is not None:
            self.seed = seed
        scenario = build_scenario(self.stage, self.seed)
        self.time = scenario["start_time"]
        self.end_time = scenario["end_time"]
        self.airports = scenario["airports"]
        self.airlines = scenario["airlines"]
        self.aircraft = scenario["aircraft"]
        self.crew = scenario["crew"]
        self.flights = scenario["flights"]
        self.disruptions = scenario["disruptions"]
        self.history: List[Dict[str, Any]] = []
        self.last_reward = RewardBreakdown()
        self.done = False
        return self.observation()

    def step(self, actions: Optional[Iterable[Dict[str, Any]]] = None) -> StepResult:
        if self.done:
            return StepResult(self.observation(), 0.0, True, {"message": "episode already done"})

        actions = list(actions or [])
        reward = RewardBreakdown()
        active_disruptions = self._activate_disruptions(reward)
        self._departure_usage: Dict[str, int] = {code: 0 for code in self.airports}

        for action in actions:
            reward.add(self._apply_action(action))

        reward.add(self._process_arrivals())
        reward.add(self._process_operational_pressure())
        self.time += self.step_minutes
        self.done = self.time >= self.end_time or self._all_flights_terminal()
        if self.done:
            reward.add(self._terminal_reward())

        self.last_reward = reward
        frame = {
            "time": self.time,
            "actions": actions,
            "active_disruptions": [asdict(item) for item in active_disruptions],
            "reward": reward.to_dict(),
            "metrics": self.metrics(),
            "observation": self.observation(),
        }
        self.history.append(frame)
        return StepResult(
            observation=self.observation(),
            reward=reward.total,
            done=self.done,
            info={
                "reward_breakdown": reward.to_dict(),
                "metrics": self.metrics(),
                "active_disruptions": [asdict(item) for item in active_disruptions],
            },
        )

    def state(self) -> Dict[str, Any]:
        return {
            "stage": self.stage,
            "seed": self.seed,
            "time": self.time,
            "end_time": self.end_time,
            "airports": {code: asdict(airport) for code, airport in self.airports.items()},
            "airlines": {code: asdict(airline) for code, airline in self.airlines.items()},
            "aircraft": {code: asdict(aircraft) for code, aircraft in self.aircraft.items()},
            "crew": {code: asdict(crew) for code, crew in self.crew.items()},
            "flights": {code: asdict(flight) for code, flight in self.flights.items()},
            "disruptions": [asdict(disruption) for disruption in self.disruptions],
            "last_reward": self.last_reward.to_dict(),
            "metrics": self.metrics(),
        }

    def observation(self) -> Dict[str, Any]:
        pending = self.pending_decisions()
        return {
            "stage": self.stage,
            "time": self.time,
            "clock": minutes_to_clock(self.time),
            "airports": [asdict(airport) for airport in self.airports.values()],
            "active_disruptions": [
                asdict(item) for item in self.disruptions if item.active and not item.resolved
            ],
            "pending_decisions": pending,
            "network_summary": self.metrics(),
            "action_schema": {
                "depart": {"flight_id": "string"},
                "hold": {"flight_id": "string", "minutes": "int", "reason": "string"},
                "cancel": {"flight_id": "string", "reason": "string"},
                "swap_aircraft": {"flight_id": "string", "aircraft_id": "string"},
                "protect_connection": {"flight_id": "string"},
            },
        }

    def pending_decisions(self) -> List[Dict[str, Any]]:
        decisions = []
        for flight in self.flights.values():
            if flight.status != "scheduled":
                continue
            if flight.scheduled_dep <= self.time and self.time >= flight.hold_until:
                aircraft = self.aircraft[flight.aircraft_id]
                crew = self.crew[flight.crew_id]
                decisions.append(
                    {
                        "flight_id": flight.flight_id,
                        "airline": flight.airline,
                        "origin": flight.origin,
                        "destination": flight.destination,
                        "scheduled_dep": flight.scheduled_dep,
                        "scheduled_arr": flight.scheduled_arr,
                        "delay_minutes": flight.dep_delay(self.time),
                        "passengers": flight.passengers,
                        "priority": flight.priority,
                        "aircraft_ready": aircraft.is_available(self.time, flight.origin),
                        "crew_ready": crew.is_available(self.time, flight.origin),
                        "weather_delay": self.airports[flight.origin].weather_delay,
                    }
                )
        return sorted(decisions, key=lambda item: (-int(item["priority"] == "emergency"), item["delay_minutes"]))

    def metrics(self) -> Dict[str, Any]:
        flights = list(self.flights.values())
        arrived = [flight for flight in flights if flight.status == "arrived"]
        cancelled = [flight for flight in flights if flight.status == "cancelled"]
        active = [flight for flight in flights if flight.status in {"scheduled", "airborne"}]
        total_dep_delay = sum(flight.dep_delay(self.time) for flight in flights)
        total_arr_delay = sum(flight.arr_delay() for flight in arrived)
        stranded = sum(
            group.count
            for flight in flights
            for group in flight.passenger_groups
            if group.stranded or flight.status == "cancelled"
        )
        satisfaction_values = [
            group.satisfaction for flight in flights for group in flight.passenger_groups
        ]
        airline_cash = {code: round(airline.cash, 2) for code, airline in self.airlines.items()}
        return {
            "flights_total": len(flights),
            "flights_arrived": len(arrived),
            "flights_cancelled": len(cancelled),
            "flights_active": len(active),
            "total_dep_delay": total_dep_delay,
            "total_arr_delay": total_arr_delay,
            "stranded_passengers": stranded,
            "avg_satisfaction": round(
                sum(satisfaction_values) / max(1, len(satisfaction_values)), 2
            ),
            "airline_cash": airline_cash,
        }

    def _activate_disruptions(self, reward: RewardBreakdown) -> List[Any]:
        active_now = []
        for disruption in self.disruptions:
            if disruption.resolved:
                continue
            if disruption.time <= self.time < disruption.time + disruption.duration:
                if not disruption.active:
                    disruption.active = True
                    self._apply_disruption_start(disruption)
                    reward.action_validity_score += 1.0
                active_now.append(disruption)
            elif disruption.active and self.time >= disruption.time + disruption.duration:
                disruption.active = False
                disruption.resolved = True
                self._apply_disruption_end(disruption)
        return active_now

    def _apply_disruption_start(self, disruption: Any) -> None:
        if disruption.kind == "weather" and disruption.target in self.airports:
            self.airports[disruption.target].weather_delay += 15 * disruption.severity
        elif disruption.kind == "runway_closure" and disruption.target in self.airports:
            self.airports[disruption.target].runway_closed_until = disruption.time + disruption.duration
        elif disruption.kind == "gate_block" and disruption.target in self.airports:
            self.airports[disruption.target].gate_blocked_until = disruption.time + disruption.duration
        elif disruption.kind == "aircraft_fault" and disruption.target in self.aircraft:
            self.aircraft[disruption.target].broken_until = disruption.time + disruption.duration
        elif disruption.kind == "crew_timeout" and disruption.target in self.crew:
            self.crew[disruption.target].duty_end = min(
                self.crew[disruption.target].duty_end, disruption.time
            )
        elif disruption.kind == "emergency" and disruption.target in self.airports:
            self.airports[disruption.target].emergency_priority = True
            for flight in self.flights.values():
                if flight.destination == disruption.target and flight.status == "airborne":
                    flight.priority = "emergency"

    def _apply_disruption_end(self, disruption: Any) -> None:
        if disruption.kind == "weather" and disruption.target in self.airports:
            self.airports[disruption.target].weather_delay = max(
                0, self.airports[disruption.target].weather_delay - 15 * disruption.severity
            )
        elif disruption.kind == "emergency" and disruption.target in self.airports:
            self.airports[disruption.target].emergency_priority = False

    def _apply_action(self, action: Dict[str, Any]) -> RewardBreakdown:
        reward = RewardBreakdown()
        kind = action.get("action")
        flight_id = action.get("flight_id")
        flight = self.flights.get(flight_id) if flight_id else None
        if kind not in {"depart", "hold", "cancel", "swap_aircraft", "protect_connection"}:
            reward.action_validity_score -= 8
            return reward
        if flight is None:
            reward.action_validity_score -= 6
            return reward
        if kind == "depart":
            return self._depart(flight)
        if kind == "hold":
            minutes = int(action.get("minutes", self.step_minutes))
            flight.hold_until = max(flight.hold_until, self.time + max(self.step_minutes, minutes))
            flight.delay_reason = action.get("reason", "held by controller")
            reward.delay_score -= 0.04 * flight.passengers * (minutes / self.step_minutes)
            reward.action_validity_score += 0.2
            return reward
        if kind == "cancel":
            return self._cancel(flight, action.get("reason", "cancelled by controller"))
        if kind == "swap_aircraft":
            new_aircraft_id = action.get("aircraft_id")
            return self._swap_aircraft(flight, new_aircraft_id)
        if kind == "protect_connection":
            return self._protect_connection(flight)
        return reward

    def _depart(self, flight: Flight) -> RewardBreakdown:
        reward = RewardBreakdown()
        if flight.status != "scheduled":
            reward.action_validity_score -= 5
            return reward
        origin = self.airports[flight.origin]
        destination = self.airports[flight.destination]
        aircraft = self.aircraft[flight.aircraft_id]
        crew = self.crew[flight.crew_id]
        departure_capacity = max(1, origin.available_runways(self.time) * 2)
        if self._departure_usage.get(flight.origin, 0) >= departure_capacity:
            reward.safety_score -= 60
            reward.action_validity_score -= 10
            return reward
        if not aircraft.is_available(self.time, flight.origin):
            reward.safety_score -= 70
            reward.action_validity_score -= 10
            return reward
        if not crew.is_available(self.time, flight.origin):
            reward.safety_score -= 50
            reward.action_validity_score -= 8
            return reward
        delay = max(0, self.time - flight.scheduled_dep)
        weather_delay = origin.weather_delay + destination.weather_delay
        flight.status = "airborne"
        flight.actual_dep = self.time
        flight.eta = self.time + flight.duration + weather_delay
        self._departure_usage[flight.origin] = self._departure_usage.get(flight.origin, 0) + 1
        aircraft.airport = "AIRBORNE"
        aircraft.available_at = flight.eta + 35
        crew.airport = "AIRBORNE"
        crew.available_at = flight.eta + 45
        reward.delay_score += max(2.0, 15.0 - delay * 0.05)
        reward.passenger_score -= delay * flight.passengers * 0.002
        reward.money_score -= delay * self.airlines[flight.airline].operating_cost_per_minute * 0.02
        reward.action_validity_score += 2
        return reward

    def _cancel(self, flight: Flight, reason: str) -> RewardBreakdown:
        reward = RewardBreakdown()
        if flight.status in {"arrived", "cancelled"}:
            reward.action_validity_score -= 8
            return reward
        flight.status = "cancelled"
        flight.cancellations_reason = reason
        for group in flight.passenger_groups:
            group.stranded = True
            group.satisfaction = max(0, group.satisfaction - 70)
        airline = self.airlines[flight.airline]
        compensation = flight.passengers * airline.compensation_per_stranded_passenger
        airline.cash -= compensation
        airline.reputation = max(0, airline.reputation - 4)
        reward.delay_score -= 30
        reward.passenger_score -= flight.passengers * 0.9
        reward.money_score -= compensation / 10_000
        return reward

    def _swap_aircraft(self, flight: Flight, aircraft_id: Optional[str]) -> RewardBreakdown:
        reward = RewardBreakdown()
        aircraft = self.aircraft.get(aircraft_id or "")
        if aircraft is None or aircraft.airline != flight.airline:
            reward.action_validity_score -= 6
            return reward
        if not aircraft.is_available(self.time, flight.origin):
            reward.action_validity_score -= 4
            return reward
        old_aircraft = self.aircraft[flight.aircraft_id]
        flight.aircraft_id = aircraft.aircraft_id
        old_aircraft.available_at = max(old_aircraft.available_at, self.time + 30)
        reward.action_validity_score += 3
        reward.money_score -= 3
        return reward

    def _protect_connection(self, flight: Flight) -> RewardBreakdown:
        reward = RewardBreakdown()
        protected = 0
        for group in flight.passenger_groups:
            if group.priority in {"connection", "priority"}:
                group.satisfaction = min(100, group.satisfaction + 12)
                protected += group.count
        reward.passenger_score += protected * 0.15
        reward.money_score -= protected * 0.03
        return reward

    def _process_arrivals(self) -> RewardBreakdown:
        reward = RewardBreakdown()
        gate_load = self._gate_load()
        for flight in self.flights.values():
            if flight.status != "airborne" or flight.eta is None or flight.eta > self.time:
                continue
            destination = self.airports[flight.destination]
            gate_capacity = destination.available_gates(self.time)
            if gate_load.get(flight.destination, 0) >= gate_capacity:
                flight.eta += self.step_minutes
                reward.delay_score -= flight.passengers * 0.04
                reward.passenger_score -= flight.passengers * 0.03
                continue
            flight.status = "arrived"
            flight.actual_arr = self.time
            aircraft = self.aircraft[flight.aircraft_id]
            crew = self.crew[flight.crew_id]
            aircraft.airport = flight.destination
            crew.airport = flight.destination
            aircraft.available_at = self.time + 35
            crew.available_at = self.time + 45
            gate_load[flight.destination] = gate_load.get(flight.destination, 0) + 1
            arrival_delay = flight.arr_delay()
            reward.delay_score += max(1.0, 12.0 - arrival_delay * 0.04)
            reward.passenger_score += max(0.0, 8.0 - arrival_delay * 0.02)
        return reward

    def _gate_load(self) -> Dict[str, int]:
        load = {code: 0 for code in self.airports}
        for flight in self.flights.values():
            if flight.status == "arrived" and flight.actual_arr is not None:
                if self.time - flight.actual_arr <= 45:
                    load[flight.destination] = load.get(flight.destination, 0) + 1
        return load

    def _process_operational_pressure(self) -> RewardBreakdown:
        reward = RewardBreakdown()
        airline_delay = {code: 0 for code in self.airlines}
        for flight in self.flights.values():
            if flight.status != "scheduled":
                continue
            delay = max(0, self.time - flight.scheduled_dep)
            if delay <= 0:
                continue
            airline_delay[flight.airline] += delay
            reward.delay_score -= min(12, delay * 0.03)
            for group in flight.passenger_groups:
                hit = 0.5 if group.priority == "standard" else 0.9
                group.satisfaction = max(0, group.satisfaction - hit)
                if delay > 120 and group.priority == "connection":
                    group.stranded = True
                    reward.passenger_score -= group.count * 0.2
            reward.passenger_score -= flight.passengers * 0.005
            reward.money_score -= self.airlines[flight.airline].operating_cost_per_minute * 0.01
        if self.stage >= 3 and airline_delay:
            values = list(airline_delay.values())
            spread = max(values) - min(values)
            reward.fairness_score -= spread * 0.01
        return reward

    def _terminal_reward(self) -> RewardBreakdown:
        reward = RewardBreakdown()
        metrics = self.metrics()
        reward.delay_score -= metrics["total_dep_delay"] * 0.01
        reward.passenger_score -= metrics["stranded_passengers"] * 0.4
        reward.passenger_score += metrics["avg_satisfaction"] * 0.5
        reward.money_score += sum(metrics["airline_cash"].values()) / 200_000
        reward.safety_score += 50
        return reward

    def _all_flights_terminal(self) -> bool:
        return all(flight.status in {"arrived", "cancelled"} for flight in self.flights.values())

    def find_available_aircraft(self, flight: Flight) -> Optional[Aircraft]:
        for aircraft in self.aircraft.values():
            if aircraft.airline == flight.airline and aircraft.is_available(self.time, flight.origin):
                return aircraft
        return None

    def find_available_crew(self, flight: Flight) -> Optional[Crew]:
        for crew in self.crew.values():
            if crew.airline == flight.airline and crew.is_available(self.time, flight.origin):
                return crew
        return None


def minutes_to_clock(minutes: int) -> str:
    hours = (minutes // 60) % 24
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"
