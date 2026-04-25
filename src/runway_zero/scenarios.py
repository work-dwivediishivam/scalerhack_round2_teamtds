from __future__ import annotations

import random
from typing import Dict, List

from runway_zero.models import Aircraft, Airline, Airport, Crew, Disruption, Flight, PassengerGroup


AIRPORTS: Dict[str, Airport] = {
    "DEL": Airport("DEL", "Indira Gandhi International", "Delhi", 28.5562, 77.1000, 3, 14),
    "BOM": Airport("BOM", "Chhatrapati Shivaji Maharaj", "Mumbai", 19.0896, 72.8656, 2, 10),
    "BLR": Airport("BLR", "Kempegowda International", "Bengaluru", 13.1986, 77.7066, 2, 10),
    "HYD": Airport("HYD", "Rajiv Gandhi International", "Hyderabad", 17.2403, 78.4294, 2, 8),
    "MAA": Airport("MAA", "Chennai International", "Chennai", 12.9941, 80.1709, 2, 8),
    "CCU": Airport("CCU", "Netaji Subhas Chandra Bose", "Kolkata", 22.6547, 88.4467, 2, 7),
    "AMD": Airport("AMD", "Sardar Vallabhbhai Patel", "Ahmedabad", 23.0772, 72.6347, 1, 5),
    "COK": Airport("COK", "Cochin International", "Kochi", 10.1520, 76.4019, 1, 5),
    "GOX": Airport("GOX", "Manohar International", "Goa", 15.7443, 73.8606, 1, 5),
    "PNQ": Airport("PNQ", "Pune International", "Pune", 18.5793, 73.9089, 1, 5),
}

AIRLINES: Dict[str, Airline] = {
    "6E": Airline("6E", "IndiGo", 3_600_000),
    "AI": Airline("AI", "Air India", 3_400_000),
    "QP": Airline("QP", "Akasa Air", 2_800_000),
    "SG": Airline("SG", "SpiceJet", 2_400_000),
}

ROUTE_MINUTES = {
    ("DEL", "BOM"): 130,
    ("BOM", "DEL"): 130,
    ("DEL", "BLR"): 160,
    ("BLR", "DEL"): 160,
    ("BOM", "BLR"): 105,
    ("BLR", "BOM"): 105,
    ("DEL", "HYD"): 135,
    ("HYD", "DEL"): 135,
    ("BOM", "HYD"): 85,
    ("HYD", "BOM"): 85,
    ("BLR", "HYD"): 75,
    ("HYD", "BLR"): 75,
    ("MAA", "DEL"): 170,
    ("DEL", "MAA"): 170,
    ("CCU", "DEL"): 140,
    ("DEL", "CCU"): 140,
    ("AMD", "BOM"): 75,
    ("BOM", "AMD"): 75,
    ("COK", "BLR"): 65,
    ("BLR", "COK"): 65,
    ("MAA", "BLR"): 55,
    ("BLR", "MAA"): 55,
    ("DEL", "AMD"): 95,
    ("AMD", "DEL"): 95,
    ("DEL", "PNQ"): 125,
    ("PNQ", "DEL"): 125,
    ("BOM", "GOX"): 65,
    ("GOX", "BOM"): 65,
    ("BOM", "PNQ"): 45,
    ("PNQ", "BOM"): 45,
    ("HYD", "MAA"): 70,
    ("MAA", "HYD"): 70,
    ("CCU", "BLR"): 150,
    ("BLR", "CCU"): 150,
    ("COK", "MAA"): 75,
    ("MAA", "COK"): 75,
}


def build_scenario(stage: int = 1, seed: int = 7) -> dict:
    rng = random.Random(seed)
    airport_codes = ["DEL", "BOM", "BLR", "HYD"] if stage == 1 else list(AIRPORTS)
    airline_codes = ["6E", "AI"] if stage == 1 else (["6E", "AI", "QP"] if stage == 2 else list(AIRLINES))
    flight_count = 44 if stage == 1 else (124 if stage == 2 else 224)
    step_window = 780 if stage == 1 else (960 if stage == 2 else 1200)

    airports = {code: _clone_airport(AIRPORTS[code]) for code in airport_codes}
    airlines = {code: AIRLINES[code] for code in airline_codes}
    aircraft = _build_aircraft(airline_codes, airport_codes, rng, count_per_airline=3 if stage == 1 else 5)
    crew = _build_crew(airline_codes, airport_codes, rng, count_per_airline=4 if stage == 1 else 7)
    flights = _build_flights(flight_count, airline_codes, airport_codes, aircraft, crew, rng, step_window, stage)
    disruptions = _build_disruptions(stage)

    return {
        "stage": stage,
        "seed": seed,
        "start_time": 360,
        "end_time": 360 + step_window,
        "airports": airports,
        "airlines": airlines,
        "aircraft": aircraft,
        "crew": crew,
        "flights": flights,
        "disruptions": disruptions,
    }


def _clone_airport(airport: Airport) -> Airport:
    return Airport(
        airport.code,
        airport.name,
        airport.city,
        airport.lat,
        airport.lon,
        airport.runways,
        airport.gates,
    )


def _build_aircraft(
    airlines: List[str], airports: List[str], rng: random.Random, count_per_airline: int
) -> Dict[str, Aircraft]:
    fleet = {}
    for airline in airlines:
        for idx in range(count_per_airline):
            airport = rng.choice(airports)
            aircraft_id = f"{airline}-A{idx + 1:02d}"
            fleet[aircraft_id] = Aircraft(aircraft_id, airline, airport, rng.choice([156, 180, 186]))
    return fleet


def _build_crew(
    airlines: List[str], airports: List[str], rng: random.Random, count_per_airline: int
) -> Dict[str, Crew]:
    crews = {}
    for airline in airlines:
        for idx in range(count_per_airline):
            airport = rng.choice(airports)
            crew_id = f"{airline}-C{idx + 1:02d}"
            crews[crew_id] = Crew(crew_id, airline, airport, duty_end=360 + rng.choice([480, 540, 600, 660]))
    return crews


def _build_flights(
    count: int,
    airlines: List[str],
    airports: List[str],
    aircraft: Dict[str, Aircraft],
    crews: Dict[str, Crew],
    rng: random.Random,
    step_window: int,
    stage: int,
) -> Dict[str, Flight]:
    flights = {}
    routes = [route for route in ROUTE_MINUTES if route[0] in airports and route[1] in airports]

    for idx in range(count):
        airline = airlines[idx % len(airlines)]
        origin, destination = rng.choice(routes)
        dep = 390 + rng.randrange(0, max(60, step_window - 220), 15)
        duration = ROUTE_MINUTES[(origin, destination)]
        flight_id = f"{airline}{100 + idx}"
        # Each scheduled leg starts with a feasible aircraft/crew assignment.
        # Later disruptions and swaps still create operational pressure, but the
        # base schedule should not be impossible before the agent acts.
        chosen_aircraft = Aircraft(
            aircraft_id=f"{airline}-F{idx + 1:03d}",
            airline=airline,
            airport=origin,
            capacity=rng.choice([156, 180, 186]),
        )
        chosen_crew = Crew(
            crew_id=f"{airline}-K{idx + 1:03d}",
            airline=airline,
            airport=origin,
            duty_end=dep + rng.choice([360, 420, 480]),
        )
        aircraft[chosen_aircraft.aircraft_id] = chosen_aircraft
        crews[chosen_crew.crew_id] = chosen_crew
        passenger_count = rng.randint(70, min(176, chosen_aircraft.capacity))
        groups = _passenger_groups(flight_id, passenger_count, rng, stage)
        flights[flight_id] = Flight(
            flight_id=flight_id,
            airline=airline,
            origin=origin,
            destination=destination,
            scheduled_dep=dep,
            scheduled_arr=dep + duration,
            aircraft_id=chosen_aircraft.aircraft_id,
            crew_id=chosen_crew.crew_id,
            passengers=passenger_count,
            priority="normal",
            passenger_groups=groups,
        )
    return dict(sorted(flights.items(), key=lambda item: item[1].scheduled_dep))


def _passenger_groups(
    flight_id: str, passenger_count: int, rng: random.Random, stage: int
) -> List[PassengerGroup]:
    if stage == 1:
        return [PassengerGroup(f"{flight_id}-P0", passenger_count)]
    vip_count = rng.randint(0, max(1, passenger_count // 12))
    connection_count = rng.randint(0, max(1, passenger_count // 5))
    standard = max(0, passenger_count - vip_count - connection_count)
    groups = [PassengerGroup(f"{flight_id}-STD", standard)]
    if connection_count:
        groups.append(PassengerGroup(f"{flight_id}-CON", connection_count, "connection"))
    if vip_count:
        groups.append(PassengerGroup(f"{flight_id}-PRI", vip_count, "priority"))
    return groups


def _build_disruptions(stage: int) -> List[Disruption]:
    base = [
        Disruption(
            "D1",
            465,
            "weather",
            "DEL",
            165,
            3,
            "Dense winter fog at Delhi forces low-visibility spacing and turns departures into a queue.",
        ),
        Disruption(
            "D2",
            540,
            "runway_closure",
            "BOM",
            120,
            3,
            "Mumbai closes one runway after debris is found during peak west-coast departures.",
        ),
        Disruption(
            "D3",
            600,
            "aircraft_fault",
            "6E-F003",
            165,
            3,
            "IndiGo aircraft 6E-F003 reports a hydraulic warning and cannot be dispatched.",
        ),
        Disruption(
            "D4",
            675,
            "gate_block",
            "BLR",
            105,
            2,
            "Bengaluru loses a contact stand after a jet bridge fault blocks gate turnaround.",
        ),
    ]
    if stage >= 2:
        base.extend(
            [
                Disruption(
                    "D5",
                    720,
                    "crew_timeout",
                    "AI-K005",
                    210,
                    3,
                    "Air India crew AI-K005 hits duty-time risk after earlier fog delays.",
                ),
                Disruption(
                    "D6",
                    765,
                    "emergency",
                    "HYD",
                    60,
                    5,
                    "A medical emergency inbound to Hyderabad forces tower priority and arrival spacing.",
                ),
                Disruption(
                    "D7",
                    825,
                    "weather",
                    "MAA",
                    120,
                    3,
                    "Chennai thunderstorm blocks ground handling and increases passenger connection risk.",
                ),
                Disruption(
                    "D8",
                    900,
                    "gate_block",
                    "CCU",
                    90,
                    2,
                    "Kolkata loses gate capacity just as missed-connection passengers arrive from Delhi.",
                ),
            ]
        )
    if stage >= 3:
        base.extend(
            [
                Disruption(
                    "D9",
                    930,
                    "demand_shock",
                    "DEL",
                    180,
                    3,
                    "Delhi sees a business-travel surge; every extra delay minute now damages reputation faster.",
                ),
                Disruption(
                    "D10",
                    990,
                    "fuel_delay",
                    "BOM",
                    135,
                    3,
                    "Mumbai fuel trucks are short staffed, raising turnaround cost for every held aircraft.",
                ),
                Disruption(
                    "D11",
                    1050,
                    "slot_conflict",
                    "BLR",
                    180,
                    4,
                    "IndiGo, Air India, Akasa Air, and SpiceJet all demand scarce Bengaluru evening slots.",
                ),
                Disruption(
                    "D12",
                    1110,
                    "weather",
                    "GOX",
                    120,
                    2,
                    "Goa coastal weather triggers diversions and blocks low-fuel aircraft from quick recovery.",
                ),
            ]
        )
    return base
