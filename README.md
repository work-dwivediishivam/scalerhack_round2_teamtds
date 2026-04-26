---
title: Runway Zero
emoji: 🛫
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Runway Zero

Runway Zero is an OpenEnv environment for training LLM agents to recover Indian
airport operations from cascading disruptions.

Static scheduling is easy to benchmark. Runway Zero tests the harder question:
can an agent keep a live airport network operational when each recovery decision
changes crew legality, passenger connections, runway capacity, airline cash, and
future congestion?

Today this work is handled by highly trained operations-control specialists
using fragmented decision-support tools. Those teams still fail during severe
cascading disruptions because there is no generally deployed autonomous system
that recovers aircraft, crew, passengers, gates, runways, airline incentives, and
fairness end to end.

## Final Submission Links

- Web demo: https://project-2pdc2.vercel.app/
- Live crisis replay: https://project-2pdc2.vercel.app/sim/?stage=4
- Training evidence dashboard: https://project-2pdc2.vercel.app/training/
- Hugging Face Space environment: https://huggingface.co/spaces/work-dwivediishivam/runway-zero
- Live Space API state endpoint: https://work-dwivediishivam-runway-zero.hf.space/state
- Training notebook URL: https://huggingface.co/spaces/work-dwivediishivam/runway-zero/blob/main/notebooks/04_llm_grpo_all_stages.ipynb
- Blog post URL: https://huggingface.co/spaces/work-dwivediishivam/runway-zero/blob/main/docs/BLOG_POST.md
- Training artifacts: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts
- YouTube script and description: [docs/YOUTUBE_PITCH_SCRIPT.md](docs/YOUTUBE_PITCH_SCRIPT.md), [docs/YOUTUBE_DESCRIPTION.md](docs/YOUTUBE_DESCRIPTION.md)

## Pitch

At 8:00 AM, the network looks stable. Then fog hits Delhi, Mumbai loses runway
capacity, Bengaluru gates jam, an aircraft develops a technical fault, crews
start timing out, and passengers begin missing connections while IndiGo, Air
India, Akasa Air, and SpiceJet compete for scarce recovery slots.

The controller is no longer solving a schedule. It is recovering a living
system.

In the real world, this requires experienced dispatchers, controllers, crew
planners, maintenance coordinators, and passenger recovery teams working under
time pressure. Runway Zero turns that human-heavy recovery problem into a
trainable OpenEnv benchmark.

> Most agent benchmarks ask whether an LLM can make a plan. Runway Zero asks
> whether it can recover after the plan breaks.

## Hackathon Fit

Runway Zero targets the themes most relevant to the OpenEnv Hackathon:

- Multi-Agent Interactions: airlines negotiate for slots while tower control
  must remain neutral and safety-first.
- Long-Horizon Planning: delays propagate across future rotations, crew duty
  limits, passenger connections, and airport throughput.
- World Modeling: the agent must track partially observable operational state,
  not just answer a static prompt.
- Self-Improvement: the same environment can generate harder crises and train
  policies against verifiable rewards.

## Environment

The environment exposes an OpenEnv-style API:

- `reset`: start a crisis scenario.
- `step`: execute a structured action and advance the airport network.
- `state`: inspect current airports, flights, crew, passengers, incidents, and
  rewards.
- `close`: release the environment.

The agent observes structured state:

- Indian airports with real coordinates, runway counts, gates, weather, and
  incident status.
- Flights across IndiGo, Air India, Akasa Air, and SpiceJet.
- Aircraft readiness, maintenance status, passenger count, and delay pressure.
- Crew legality, duty timeout risk, and rotation constraints.
- Passenger connection risk, stranded passenger pressure, and satisfaction.
- Airline cash pressure and fairness constraints in economic scenarios.

The agent emits structured actions:

- depart flight
- hold flight
- cancel flight only when recovery is impossible
- swap aircraft
- request maintenance
- protect passenger connections
- negotiate scarce slots
- allocate compensation
- rebalance airline fairness

## Four Crisis Levels

| Level | Scenario | What the agent must learn |
| --- | --- | --- |
| 1 | Operations Recovery | Keep a compact network safe and on time under fog, runway loss, and faults |
| 2 | Passenger-Aware Network | Protect connections and satisfaction while delays propagate |
| 3 | Economic Multi-Agent Control | Balance airline incentives, airport throughput, cash, fairness, and passenger harm |
| 4 | IndiGo Crisis Replay | Recover a December 2025-style crew availability and cancellation cascade |

## Reward Design

Runway Zero uses component rewards rather than a single opaque score:

- Delay: penalizes departure and arrival delay minutes.
- Safety: heavily penalizes unsafe runway, gate, aircraft, or crew assignments.
- Passengers: rewards protected connections and penalizes stranded passengers.
- Money: penalizes compensation, fuel waste, crew overtime, and airline cash
  damage.
- Fairness: penalizes slot capture by one airline when system-level harm rises.
- Validity: rewards well-formed actions that execute inside the environment.

The public dashboard reports a normalized 0-100 Recovery Score so judges can
compare base and RL-trained controllers quickly. Training artifacts preserve the
underlying reward components and run summaries.

## Training Evidence

The judge-facing comparison is exactly the requested one: four base LLM
controllers versus their RL-trained versions.

Models:

- Qwen2.5 Coder 7B
- Qwen3 14B
- Gemma 4 31B IT
- GPT-OSS 120B

Across all stages and models, the shipped evaluation shows:

| Metric | Base LLMs | RL-trained LLMs |
| --- | ---: | ---: |
| Average Recovery Score | 26.1 | 86.2 |
| Total delay minutes | 176,157 | 16,823 |
| Cancelled flights | 1,827 | 393 |
| Average satisfaction | 51.7% | 82.0% |

Hosted TRL/GRPO artifact links:

- Qwen2.5 Coder 7B: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/qwen25_coder_7b_hf_grpo/runway_zero_qwen25_coder_7b_hf_grpo.tgz
- Qwen3 14B: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/qwen3_14b_hf_grpo/qwen3_14b_hf_grpo.tgz
- GPT-OSS 120B: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/gpt_oss_120b_hf_grpo/gpt_oss_120b_hf_grpo.tgz
- Gemma 4 31B IT: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/gemma4_31b_it_hf_grpo/gemma4_31b_it_hf_grpo.tgz

## Training Command

The main training entrypoint serializes environment observations into prompts,
parses model JSON actions, executes those actions inside Runway Zero, and trains
from the returned environment reward using TRL/GRPO.

```bash
pip install -r requirements-training.txt
python scripts/train_llm_grpo_all_stages.py \
  --model Qwen/Qwen2.5-Coder-7B-Instruct \
  --stages 1 2 3 \
  --max-steps 60 \
  --report-to tensorboard \
  --output-dir results/llm_runs/qwen25_runway_zero
```

The Colab-style notebook for judges is:

- `notebooks/04_llm_grpo_all_stages.ipynb`

## Repository Layout

```text
src/runway_zero/       Environment, simulator, rewards, scenarios, API server
scripts/               Training, hosted rollout, plotting, replay export
notebooks/             Colab-oriented OpenEnv and TRL notebooks
web/                   Next.js crisis replay and training dashboard
docs/                  Blog post, pitch script, submission checklist, design notes
results/               Training summaries, evaluation metrics, local artifacts
openenv.yaml           Environment manifest
```

## Run Locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn runway_zero.server:app --reload
```

Run the web dashboard:

```bash
cd web
npm install
npm run dev
```

## Key Files

- [docs/BLOG_POST.md](docs/BLOG_POST.md): final Hugging Face blog/writeup.
- [docs/YOUTUBE_PITCH_SCRIPT.md](docs/YOUTUBE_PITCH_SCRIPT.md): 2-minute demo script.
- [docs/YOUTUBE_DESCRIPTION.md](docs/YOUTUBE_DESCRIPTION.md): YouTube description with submission links.
- [docs/FINAL_SUBMISSION_CHECKLIST.md](docs/FINAL_SUBMISSION_CHECKLIST.md): final form links.
- [docs/TRAINING.md](docs/TRAINING.md): training and evaluation details.
- [docs/REWARD_DESIGN.md](docs/REWARD_DESIGN.md): reward channels and anti-gaming constraints.
