from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class Airport:
    code: str
    name: str
    city: str
    lat: float
    lon: float
    runways: int
    gates: int
    timezone: str = "Asia/Kolkata"
    runway_closed_until: int = 0
    gate_blocked_until: int = 0
    weather_delay: int = 0
    emergency_priority: bool = False

    def available_runways(self, time_min: int) -> int:
        if time_min < self.runway_closed_until:
            return max(0, self.runways - 1)
        return self.runways

    def available_gates(self, time_min: int) -> int:
        if time_min < self.gate_blocked_until:
            return max(0, self.gates - 1)
        return self.gates


@dataclass
class Airline:
    code: str
    name: str
    cash: float
    reputation: float = 80.0
    operating_cost_per_minute: float = 120.0
    compensation_per_stranded_passenger: float = 3500.0


@dataclass
class Aircraft:
    aircraft_id: str
    airline: str
    airport: str
    capacity: int
    available_at: int = 0
    broken_until: int = 0

    def is_available(self, time_min: int, airport: str) -> bool:
        return self.airport == airport and time_min >= self.available_at and time_min >= self.broken_until


@dataclass
class Crew:
    crew_id: str
    airline: str
    airport: str
    duty_end: int
    available_at: int = 0

    def is_available(self, time_min: int, airport: str) -> bool:
        return self.airport == airport and time_min >= self.available_at and time_min < self.duty_end


@dataclass
class PassengerGroup:
    group_id: str
    count: int
    priority: str = "standard"
    connection_flight_id: Optional[str] = None
    satisfaction: float = 100.0
    stranded: bool = False


@dataclass
class Flight:
    flight_id: str
    airline: str
    origin: str
    destination: str
    scheduled_dep: int
    scheduled_arr: int
    aircraft_id: str
    crew_id: str
    passengers: int
    status: str = "scheduled"
    actual_dep: Optional[int] = None
    actual_arr: Optional[int] = None
    eta: Optional[int] = None
    hold_until: int = 0
    priority: str = "normal"
    passenger_groups: List[PassengerGroup] = field(default_factory=list)
    delay_reason: Optional[str] = None
    cancellations_reason: Optional[str] = None

    @property
    def duration(self) -> int:
        return max(30, self.scheduled_arr - self.scheduled_dep)

    def dep_delay(self, now: int) -> int:
        if self.status == "cancelled":
            return 0
        reference = self.actual_dep if self.actual_dep is not None else now
        return max(0, reference - self.scheduled_dep)

    def arr_delay(self) -> int:
        if self.actual_arr is None:
            return 0
        return max(0, self.actual_arr - self.scheduled_arr)


@dataclass
class Disruption:
    disruption_id: str
    time: int
    kind: str
    target: str
    duration: int
    severity: int = 1
    message: str = ""
    active: bool = False
    resolved: bool = False


@dataclass
class RewardBreakdown:
    delay_score: float = 0.0
    safety_score: float = 0.0
    passenger_score: float = 0.0
    money_score: float = 0.0
    fairness_score: float = 0.0
    action_validity_score: float = 0.0

    @property
    def total(self) -> float:
        return (
            self.delay_score
            + self.safety_score
            + self.passenger_score
            + self.money_score
            + self.fairness_score
            + self.action_validity_score
        )

    def add(self, other: "RewardBreakdown") -> None:
        self.delay_score += other.delay_score
        self.safety_score += other.safety_score
        self.passenger_score += other.passenger_score
        self.money_score += other.money_score
        self.fairness_score += other.fairness_score
        self.action_validity_score += other.action_validity_score

    def to_dict(self) -> Dict[str, float]:
        data = asdict(self)
        data["total"] = self.total
        return data


@dataclass
class StepResult:
    observation: Dict[str, Any]
    reward: float
    done: bool
    info: Dict[str, Any]

