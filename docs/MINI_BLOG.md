---
license: mit
tags:
  - openenv
  - reinforcement-learning
  - grpo
  - llm-agents
  - airport-operations
  - hackathon
---

# Runway Zero: Training Agents To Recover After The Plan Breaks

Most agent benchmarks ask whether an LLM can make a plan. Runway Zero asks a
harder question: can it recover when the plan starts failing in real time?

Runway Zero is an OpenEnv-style environment for cascading Indian airport
operations. The agent begins with a normal national flight schedule, then has to
respond as disruptions compound: fog hits Delhi, Mumbai loses runway capacity,
Bengaluru gates jam, an IndiGo aircraft needs maintenance, crews approach
duty-time limits, Hyderabad receives an emergency arrival, and airlines compete
for scarce evening slots.

The agent does not answer with prose. It emits structured JSON actions:
departures, holds, cancellations, aircraft swaps, maintenance requests,
reroutes, passenger compensation, connection protection, and slot negotiation.
Those actions are executed inside the simulator. The environment returns a
decomposed reward over delay, safety, passenger satisfaction, airline money,
fairness, and action validity.

The environment has four public crisis levels:

1. Operations Recovery: a compact four-airport network focused on safe
   departures, arrivals, aircraft readiness, and delay reduction.
2. Passenger-Aware Recovery: a larger network with connections, stranded
   passengers, emergencies, and satisfaction penalties.
3. Economic Multi-Agent Control: ten Indian airports where IndiGo, Air India,
   Akasa Air, and SpiceJet compete for slots while Tower Central must stay
   neutral.
4. IndiGo Crisis Replay: a December 2025-style crew availability and
   mass-cancellation crisis where the model must rebuild the network without
   pretending every flight can be saved.

For the demo, the website replays deterministic simulator traces. It shows a custom
animated India operations board, airport zoom views with runways and gates,
active disruption context, agent negotiation messages, recovery-score bars, speed
controls, and base-model-vs-RL-trained comparison rows.

Training evidence is presented as base LLM versus RL-trained LLM, model by
model. Internal simulator-debug policies are kept out of the public
judge-facing story. Hosted Hugging Face GPU jobs trained four large model policies with TRL
GRPO across stages 1, 2, and 3: Qwen2.5-Coder-7B-Instruct, Qwen3-14B,
GPT-OSS-120B, and Gemma-4-31B-IT. The Level 4 replay uses the same comparison
format to show how those learned recovery behaviors transfer to a real-world
mass-disruption scenario.

The raw RL reward can be negative because safety, delay, passenger harm, and
money penalties can exceed bonuses. The website therefore uses a normalized
0-100 Recovery Score for the pitch while preserving raw rewards in technical
artifacts.

Why this matters: deployed agents will not operate in clean, single-turn
prompt-response tasks. They will operate inside systems where resources
disappear, stakeholders disagree, APIs fail, and early decisions change future
state. Runway Zero turns that recovery skill into a measurable training
environment.

Live demo: https://project-2pdc2.vercel.app/

OpenEnv Space: https://work-dwivediishivam-runway-zero.hf.space/state

Training evidence: https://project-2pdc2.vercel.app/training/
