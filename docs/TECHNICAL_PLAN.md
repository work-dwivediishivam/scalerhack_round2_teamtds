# Runway Zero Technical Plan

## Goal

Runway Zero trains and evaluates LLM agents on cascading airport recovery. The
agent must operate a live Indian airport network where disruptions compound over
time: fog slows Delhi, Mumbai loses a runway, Bengaluru gates jam, aircraft
break, crews time out, and passenger connections become fragile.

The hackathon artifact is not only a notebook. It is a full OpenEnv-style
environment plus a replay dashboard that makes the agent's decisions and reward
signals visible.

## Architecture

```text
Python simulator -> OpenEnv/FastAPI wrapper -> training/evaluation scripts
                                      |
                                      v
                           exported replay traces
                                      |
                                      v
                         Next.js visual dashboard
```

## Simulator

The simulator is deterministic by `stage` and `seed`.

- `reset(stage, seed)` creates airports, airlines, aircraft, crews, flights, and
  scheduled disruptions.
- `step(actions)` applies structured actions and advances time.
- `state()` returns the full serializable world state.

The simulator supports:

- real Indian airport geography
- real-world airline context with IndiGo, Air India, Akasa Air, and SpiceJet
- staged difficulty
- runway/gate capacity
- aircraft and crew availability
- passenger groups
- active disruptions
- reward decomposition

## Difficulty Stages

| Stage | Scope | Main capability |
| --- | --- | --- |
| 1 | 4 airports, 2 airlines, small schedule | Basic operational recovery |
| 2 | 10 airports, 3 airlines, passenger groups | Passenger-aware planning |
| 3 | 10 airports, 4 airlines, economics/fairness | Multi-agent operations and business tradeoffs |

## Actions

The agent produces JSON actions:

```json
{"action": "depart", "flight_id": "6E114"}
{"action": "hold", "flight_id": "AI121", "minutes": 30, "reason": "crew recovery"}
{"action": "cancel", "flight_id": "QP202", "reason": "unrecoverable aircraft fault"}
{"action": "swap_aircraft", "flight_id": "6E140", "aircraft_id": "6E-F021"}
{"action": "protect_connection", "flight_id": "AI155"}
{"action": "request_maintenance", "flight_id": "6E103"}
{"action": "allocate_compensation", "flight_id": "SG180", "amount": 1800}
{"action": "negotiate_slot", "flight_id": "QP190", "bid": 12000, "promise": "passenger protection"}
```

Structured actions make the environment trainable and reduce reward hacking from
free-form text.

## Website

The dashboard is a replay UI, not a separate toy. It consumes JSON traces
exported from the real simulator.

Main viewport:

- India airport map
- animated route arcs
- airport status nodes
- airport zoom panel with runways and gates

Side panel:

- live reward delta
- reward component bars
- operational metrics
- agent decisions
- active disruptions
- base-model vs RL-trained selector
- multi-agent airline/tower negotiation feed

## MVP Strategy

The completed submission is:

1. Stage 1, Stage 2, and Stage 3 simulator working.
2. Baseline policies and trained local RL controller evaluated.
3. Replay UI showing base-model vs RL-trained behavior.
4. TRL/GRPO scripts and notebooks for all stages.
5. Hosted Hugging Face GPU GRPO runs on Qwen2.5-Coder-7B, Qwen3-14B,
   GPT-OSS-120B, and Gemma-4-31B-IT.
6. README, mini-blog, reward plots, replay traces, and Hugging Face Space packaging.
