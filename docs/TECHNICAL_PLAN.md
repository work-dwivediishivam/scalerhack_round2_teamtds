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
- fictional airline operators
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
| 2 | 8 airports, 3 airlines, passenger groups | Passenger-aware planning |
| 3 | 8 airports, 4 airlines, economics/fairness | Multi-agent operations and business tradeoffs |

## Actions

The agent produces JSON actions:

```json
{"action": "depart", "flight_id": "SI114"}
{"action": "hold", "flight_id": "BA121", "minutes": 30, "reason": "crew recovery"}
{"action": "cancel", "flight_id": "AN202", "reason": "unrecoverable aircraft fault"}
{"action": "swap_aircraft", "flight_id": "SI140", "aircraft_id": "SI-F021"}
{"action": "protect_connection", "flight_id": "BA155"}
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
- baseline vs recovery policy selector

## MVP Strategy

The reliable MVP is:

1. Stage 1 and Stage 2 simulator working.
2. Baseline policies evaluated.
3. Replay UI showing FIFO vs recovery policy.
4. TRL/GRPO notebook showing how the environment is trained.
5. README, reward plots, and Hugging Face Space packaging.

Stage 3 is included in code as the ambitious extension, but the demo should not
depend on it being the only working part.

