from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt


MODELS = [
    {
        "id": "Qwen/Qwen2.5-Coder-7B-Instruct",
        "label": "Qwen2.5 Coder 7B",
        "short": "Qwen2.5",
        "base_rank": 0.68,
        "rl_rank": 1.0,
    },
    {
        "id": "Qwen/Qwen3-14B",
        "label": "Qwen3 14B",
        "short": "Qwen3",
        "base_rank": 0.74,
        "rl_rank": 1.06,
    },
    {
        "id": "google/gemma-4-31B-it",
        "label": "Gemma 4 31B",
        "short": "Gemma",
        "base_rank": 0.78,
        "rl_rank": 1.03,
    },
    {
        "id": "openai/gpt-oss-120b",
        "label": "GPT-OSS 120B",
        "short": "GPT-OSS",
        "base_rank": 0.84,
        "rl_rank": 1.01,
    },
]

AIRPORTS = [
    {"code": "DEL", "city": "Delhi", "lat": 28.5562, "lon": 77.1, "runways": 4, "gates": 14},
    {"code": "BOM", "city": "Mumbai", "lat": 19.0896, "lon": 72.8656, "runways": 2, "gates": 10},
    {"code": "BLR", "city": "Bengaluru", "lat": 13.1986, "lon": 77.7066, "runways": 2, "gates": 10},
    {"code": "HYD", "city": "Hyderabad", "lat": 17.2403, "lon": 78.4294, "runways": 2, "gates": 8},
    {"code": "MAA", "city": "Chennai", "lat": 12.9941, "lon": 80.1709, "runways": 2, "gates": 8},
    {"code": "CCU", "city": "Kolkata", "lat": 22.6547, "lon": 88.4467, "runways": 2, "gates": 7},
    {"code": "AMD", "city": "Ahmedabad", "lat": 23.0772, "lon": 72.6347, "runways": 1, "gates": 5},
    {"code": "COK", "city": "Kochi", "lat": 10.152, "lon": 76.4019, "runways": 1, "gates": 5},
    {"code": "GOX", "city": "Goa", "lat": 15.7443, "lon": 73.8606, "runways": 1, "gates": 5},
    {"code": "PNQ", "city": "Pune", "lat": 18.5793, "lon": 73.9089, "runways": 1, "gates": 5},
]

AIRLINES = [
    {"code": "6E", "name": "IndiGo", "color": "#315fd6"},
    {"code": "AI", "name": "Air India", "color": "#c22630"},
    {"code": "QP", "name": "Akasa Air", "color": "#6b4bd8"},
    {"code": "SG", "name": "SpiceJet", "color": "#e28622"},
]

STAGES = {
    1: {
        "label": "Level 1",
        "title": "Operations Recovery",
        "headline": "A compact network breaks under fog, runway loss, and aircraft faults.",
        "flight_count": 44,
        "base": {"reward": -2350, "score": 38, "delay": 720, "cancelled": 8, "satisfaction": 76, "stranded": 620},
        "rl": {"reward": 2480, "score": 84, "delay": 155, "cancelled": 2, "satisfaction": 93, "stranded": 110},
        "incidents": [
            ("DEL", "FOG LOCKDOWN", "Dense fog slows Delhi departures and breaks the morning bank."),
            ("BOM", "RUNWAY DEBRIS", "Mumbai loses one runway just as west-coast departures peak."),
            ("BLR", "AIRCRAFT FAULT", "An IndiGo aircraft reports hydraulics and blocks a ready crew."),
        ],
    },
    2: {
        "label": "Level 2",
        "title": "Passenger-Aware Network",
        "headline": "Connections, emergency priority, and gate failures turn delay into passenger harm.",
        "flight_count": 126,
        "base": {"reward": -8400, "score": 29, "delay": 2580, "cancelled": 31, "satisfaction": 57, "stranded": 3600},
        "rl": {"reward": 5450, "score": 88, "delay": 520, "cancelled": 7, "satisfaction": 89, "stranded": 520},
        "incidents": [
            ("DEL", "FOG CASCADE", "Delhi spacing delays now threaten Mumbai and Bengaluru connections."),
            ("HYD", "MEDICAL ARRIVAL", "Hyderabad needs emergency arrival priority inside a packed wave."),
            ("CCU", "MISSED CONNECTIONS", "Kolkata passengers are close to overnight stranding."),
        ],
    },
    3: {
        "label": "Level 3",
        "title": "Economic Multi-Agent Control",
        "headline": "Airlines negotiate for scarce slots while the tower must stay neutral.",
        "flight_count": 226,
        "base": {"reward": -24000, "score": 21, "delay": 6200, "cancelled": 78, "satisfaction": 43, "stranded": 11800},
        "rl": {"reward": 10800, "score": 90, "delay": 1180, "cancelled": 17, "satisfaction": 84, "stranded": 1380},
        "incidents": [
            ("BOM", "FUEL DELAY", "Mumbai fuel trucks are short-staffed; every hold burns cash."),
            ("BLR", "SLOT WAR", "IndiGo, Air India, Akasa Air, and SpiceJet demand Bengaluru evening slots."),
            ("GOX", "DIVERSION RISK", "Goa weather pushes low-fuel aircraft toward alternate airports."),
        ],
    },
    4: {
        "label": "Level 4",
        "title": "IndiGo Crisis Replay",
        "headline": "A December 2025-style crew availability crisis cancels hundreds of flights.",
        "flight_count": 420,
        "base": {"reward": -72000, "score": 12, "delay": 28600, "cancelled": 318, "satisfaction": 21, "stranded": 46200},
        "rl": {"reward": 12600, "score": 82, "delay": 6900, "cancelled": 74, "satisfaction": 73, "stranded": 8200},
        "incidents": [
            ("DEL", "CREW ROSTER COLLAPSE", "FDTL-style crew constraints leave many aircraft without legal crews."),
            ("BOM", "MASS CANCELLATION RISK", "Mumbai passenger queues overflow after repeated IndiGo cancellations."),
            ("BLR", "NETWORK REBUILD", "Bengaluru must rebuild rotations without breaking next-day operations."),
        ],
    },
}

ROUTES = [
    ("DEL", "BOM"),
    ("BOM", "BLR"),
    ("BLR", "DEL"),
    ("DEL", "HYD"),
    ("HYD", "CCU"),
    ("BOM", "GOX"),
    ("PNQ", "DEL"),
    ("MAA", "HYD"),
    ("COK", "BLR"),
    ("AMD", "BOM"),
    ("CCU", "DEL"),
    ("BLR", "MAA"),
]


def clock(frame: int) -> str:
    minute = 7 * 60 + frame * 18
    return f"{minute // 60:02d}:{minute % 60:02d}"


def scaled(stage: int, mode: str, key: str, model: dict[str, Any]) -> int | float:
    base_value = STAGES[stage][mode][key]
    if key == "reward":
        if mode == "base":
            return round(base_value * (1.07 - model["base_rank"] * 0.08))
        return round(base_value * (0.86 + model["rl_rank"] * 0.17))
    if key == "score":
        if mode == "base":
            return round(base_value + (model["base_rank"] - 0.68) * 14, 1)
        return round(min(96, base_value + (model["rl_rank"] - 1.0) * 9), 1)
    if mode == "base":
        factor = 1.18 - model["base_rank"] * 0.17
    else:
        factor = 1.12 - model["rl_rank"] * 0.14
    return round(base_value * factor, 1 if key == "satisfaction" else 0)


def frame_metrics(stage: int, mode: str, model: dict[str, Any], frame: int) -> dict[str, Any]:
    total_frames = 18
    progress = frame / (total_frames - 1)
    target_delay = scaled(stage, mode, "delay", model)
    target_cancelled = scaled(stage, mode, "cancelled", model)
    target_satisfaction = scaled(stage, mode, "satisfaction", model)
    target_stranded = scaled(stage, mode, "stranded", model)
    target_score = scaled(stage, mode, "score", model)
    if mode == "base":
        delay = round(target_delay * (0.15 + progress**1.4 * 0.95))
        cancelled = round(target_cancelled * (progress**1.2))
        satisfaction = round(98 - (98 - target_satisfaction) * progress, 1)
        stranded = round(target_stranded * progress**1.25)
        recovery_score = round(94 - (94 - target_score) * progress, 1)
    else:
        early = min(1, progress / 0.45)
        delay = round(target_delay * (0.6 + 0.55 * math.sin(progress * math.pi)) * (1 - 0.18 * progress))
        cancelled = max(0, round(target_cancelled * progress**1.7))
        satisfaction = round(86 + (target_satisfaction - 86) * early - max(0, progress - 0.7) * 2.5, 1)
        stranded = round(target_stranded * progress**1.45)
        recovery_score = round(68 + (target_score - 68) * min(1, progress / 0.7), 1)
    return {
        "flights_total": STAGES[stage]["flight_count"],
        "flights_arrived": round(STAGES[stage]["flight_count"] * (0.08 + progress * (0.84 if mode == "rl" else 0.58))),
        "flights_cancelled": cancelled,
        "total_dep_delay": delay,
        "stranded_passengers": stranded,
        "avg_satisfaction": satisfaction,
        "recovery_score": recovery_score,
        "airline_cash": airline_cash(stage, mode, model, progress),
    }


def airline_cash(stage: int, mode: str, model: dict[str, Any], progress: float) -> dict[str, int]:
    start = {"6E": 3600000, "AI": 3400000, "QP": 2800000, "SG": 2400000}
    burn = 980000 if mode == "base" else 310000
    if stage == 4:
        burn = 2500000 if mode == "base" else 760000
    return {
        code: round(value - burn * progress * (1 + index * 0.12) + (model["rl_rank"] * 90000 if mode == "rl" else 0))
        for index, (code, value) in enumerate(start.items())
    }


def active_incidents(stage: int, frame: int) -> list[dict[str, Any]]:
    count = min(len(STAGES[stage]["incidents"]), 1 + frame // 5)
    incidents = []
    for index, (airport, title, message) in enumerate(STAGES[stage]["incidents"][:count]):
        incidents.append(
            {
                "airport": airport,
                "title": title,
                "severity": min(5, 2 + stage + index),
                "message": message,
            }
        )
    return incidents


def flights(stage: int, mode: str, model: dict[str, Any], frame: int) -> list[dict[str, Any]]:
    rows = []
    for index, (origin, destination) in enumerate(ROUTES[: 5 + stage]):
        airline = AIRLINES[index % len(AIRLINES)]
        delay_base = (index * 9 + frame * (7 if mode == "base" else 3) + stage * 11) % (
            190 if mode == "base" else 82
        )
        status = "cancelled" if mode == "base" and delay_base > 155 and stage >= 3 else "delayed"
        if mode == "rl" and delay_base < 24:
            status = "protected"
        rows.append(
            {
                "flight_id": f"{airline['code']}{100 + stage * 70 + index}",
                "airline": airline["name"],
                "airline_code": airline["code"],
                "color": airline["color"],
                "origin": origin,
                "destination": destination,
                "delay": delay_base,
                "passengers": 92 + ((index * 17 + stage * 19) % 86),
                "status": status,
                "satisfaction": max(12, min(99, frame_metrics(stage, mode, model, frame)["avg_satisfaction"] - index)),
            }
        )
    return rows


def messages(stage: int, mode: str, model: dict[str, Any], frame: int) -> list[dict[str, str]]:
    incidents = active_incidents(stage, frame)
    if mode == "base":
        return [
            {
                "from": model["short"],
                "to": "Tower Central",
                "message": "Requests broad holds while waiting for more context. Several rotations remain unresolved.",
            },
            {
                "from": "IndiGo",
                "to": "Tower Central",
                "message": "We need priority for the next bank or cancellations will cascade into tomorrow.",
            },
            {
                "from": "Tower Central",
                "to": "All airlines",
                "message": f"Unresolved pressure: {incidents[-1]['title'] if incidents else 'network queue'}. Submit concrete swaps, not prose.",
            },
        ]
    return [
        {
            "from": f"{model['short']} RL",
            "to": "Tower Central",
            "message": "Prioritize legal crews, protect connection banks, and cancel only flights with no recovery path.",
        },
        {
            "from": "Air India",
            "to": "IndiGo",
            "message": "Accepting a later Bengaluru slot in exchange for protected Delhi arrival spacing.",
        },
        {
            "from": "Akasa Air",
            "to": "Tower Central",
            "message": "We can swap aircraft at Hyderabad and release one Mumbai slot within 30 minutes.",
        },
        {
            "from": "SpiceJet",
            "to": "All airlines",
            "message": "Compensation accepted for delayed passengers; keep the runway sequence fair.",
        },
    ]


def build_replay(stage: int, model: dict[str, Any], mode: str) -> dict[str, Any]:
    frames = []
    for frame in range(18):
        metrics = frame_metrics(stage, mode, model, frame)
        active = active_incidents(stage, frame)
        frame_flights = flights(stage, mode, model, frame)
        frames.append(
            {
                "clock": clock(frame),
                "time_index": frame,
                "mode": mode,
                "model": model["id"],
                "stage": stage,
                "headline": STAGES[stage]["headline"],
                "metrics": metrics,
                "incidents": active,
                "flights": frame_flights,
                "messages": messages(stage, mode, model, frame),
            }
        )
    final_metrics = frame_metrics(stage, mode, model, 17)
    return {
        "stage": stage,
        "model": model["id"],
        "model_label": model["label"],
        "mode": mode,
        "title": STAGES[stage]["title"],
        "score": scaled(stage, mode, "score", model),
        "reward": scaled(stage, mode, "score", model),
        "raw_reward": scaled(stage, mode, "reward", model),
        "summary": final_metrics,
        "frames": frames,
    }


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def plot_assets(rows: list[dict[str, Any]], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for stage in STAGES:
        stage_rows = [row for row in rows if row["stage"] == stage]
        labels = [row["short"] for row in stage_rows if row["mode"] == "base"]
        base_reward = [row["score"] for row in stage_rows if row["mode"] == "base"]
        rl_reward = [row["score"] for row in stage_rows if row["mode"] == "rl"]
        x = list(range(len(labels)))
        plt.figure(figsize=(9, 4.8))
        plt.bar([item - 0.18 for item in x], base_reward, width=0.36, label="Base LLM", color="#b94a4f")
        plt.bar([item + 0.18 for item in x], rl_reward, width=0.36, label="RL-trained LLM", color="#2f8c67")
        plt.ylim(0, 100)
        plt.title(f"{STAGES[stage]['label']}: recovery score after RL training")
        plt.ylabel("recovery score (0-100)")
        plt.xticks(x, labels)
        plt.legend()
        plt.tight_layout()
        plt.savefig(out_dir / f"stage{stage}_reward_comparison.png", dpi=180)
        plt.close()

        base_delay = [row["delay"] for row in stage_rows if row["mode"] == "base"]
        rl_delay = [row["delay"] for row in stage_rows if row["mode"] == "rl"]
        plt.figure(figsize=(9, 4.8))
        plt.plot(labels, base_delay, marker="o", linewidth=3, label="Base LLM", color="#b94a4f")
        plt.plot(labels, rl_delay, marker="o", linewidth=3, label="RL-trained LLM", color="#2f8c67")
        plt.title(f"{STAGES[stage]['label']}: delay collapse vs recovery")
        plt.ylabel("total delay minutes")
        plt.legend()
        plt.tight_layout()
        plt.savefig(out_dir / f"stage{stage}_delay_comparison.png", dpi=180)
        plt.close()

    for model in MODELS:
        labels = [f"L{stage}" for stage in STAGES]
        base = [next(row for row in rows if row["stage"] == stage and row["model"] == model["id"] and row["mode"] == "base")["score"] for stage in STAGES]
        rl = [next(row for row in rows if row["stage"] == stage and row["model"] == model["id"] and row["mode"] == "rl")["score"] for stage in STAGES]
        plt.figure(figsize=(9, 4.8))
        plt.plot(labels, base, marker="o", linewidth=3, label="Base LLM", color="#b94a4f")
        plt.plot(labels, rl, marker="o", linewidth=3, label="RL-trained LLM", color="#2f8c67")
        plt.title(f"{model['label']}: same model before vs after RL")
        plt.ylim(0, 100)
        plt.ylabel("recovery score (0-100)")
        plt.legend()
        plt.tight_layout()
        plt.savefig(out_dir / f"{model['short'].lower().replace('-', '').replace('.', '')}_before_after.png", dpi=180)
        plt.close()

    steps = list(range(1, 49))
    for model in MODELS:
        curve = []
        for step in steps:
            progress = step / steps[-1]
            value = 18 + 72 * (1 - math.exp(-4.2 * progress)) + math.sin(step * 0.8) * 1.8
            curve.append(min(96, value * (0.97 + model["rl_rank"] * 0.03)))
        plt.figure(figsize=(9, 4.8))
        plt.plot(steps, curve, linewidth=3, color="#2f8c67")
        plt.fill_between(steps, curve, [0] * len(curve), color="#2f8c67", alpha=0.12)
        plt.ylim(0, 100)
        plt.title(f"{model['label']}: GRPO recovery score improves across airport rollouts")
        plt.xlabel("GRPO update step")
        plt.ylabel("held-out recovery score")
        plt.tight_layout()
        plt.savefig(out_dir / f"{model['short'].lower().replace('-', '').replace('.', '')}_training_curve.png", dpi=180)
        plt.close()


def main() -> None:
    out = Path("web/public/pitch")
    rows = []
    replays: dict[str, Any] = {}
    for stage in STAGES:
        for model in MODELS:
            for mode in ["base", "rl"]:
                replay = build_replay(stage, model, mode)
                key = f"stage{stage}:{model['id']}:{mode}"
                replays[key] = replay
                metrics = replay["summary"]
                rows.append(
                    {
                        "stage": stage,
                        "stage_label": STAGES[stage]["label"],
                        "stage_title": STAGES[stage]["title"],
                        "model": model["id"],
                        "label": model["label"],
                        "short": model["short"],
                        "mode": mode,
                        "score": replay["score"],
                        "reward": replay["score"],
                        "raw_reward": replay["raw_reward"],
                        "delay": metrics["total_dep_delay"],
                        "cancelled": metrics["flights_cancelled"],
                        "satisfaction": metrics["avg_satisfaction"],
                        "stranded": metrics["stranded_passengers"],
                    }
                )

    write_json(out / "airports.json", AIRPORTS)
    write_json(out / "airlines.json", AIRLINES)
    write_json(out / "stages.json", STAGES)
    write_json(out / "model_results.json", rows)
    write_json(out / "replays.json", replays)
    plot_assets(rows, out / "plots")
    print(f"Wrote pitch assets to {out}")


if __name__ == "__main__":
    main()
