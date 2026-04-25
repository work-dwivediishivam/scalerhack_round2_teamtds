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

**Runway Zero** is an OpenEnv-style benchmark for training LLM agents to recover
airport operations from cascading disruptions.

## Submission Links

- Web demo: https://project-2pdc2.vercel.app/
- Training/results page: https://project-2pdc2.vercel.app/training/
- Level 3 replay: https://project-2pdc2.vercel.app/sim/?stage=3
- OpenEnv/Hugging Face Space API: https://work-dwivediishivam-runway-zero.hf.space/state
- Hosted Qwen GRPO artifact: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/qwen25_coder_7b_hf_grpo/runway_zero_qwen25_coder_7b_hf_grpo.tgz
- Mini-blog/writeup: [docs/MINI_BLOG.md](docs/MINI_BLOG.md)
- Hugging Face mini-blog/model card: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/README.md

Static planning asks whether an agent can make a schedule. Runway Zero asks
whether it can keep the schedule alive after fog, runway closures, aircraft
faults, crew timeouts, gate congestion, and passenger connection failures start
propagating across the network.

## What The Agent Does

The agent acts as an operations controller for a simulated Indian airport
network. At each timestep it observes flights, airports, runways, gates,
aircraft, crew, passengers, weather, disruptions, and pending decisions. It then
chooses structured actions such as departing a flight, holding it, canceling it,
swapping aircraft, or protecting passenger connections.

## Pitch

At 8:00 AM, the network looks stable. Then fog hits Delhi, Mumbai loses a
runway, Bengaluru gates jam, an IndiGo aircraft breaks, crews start timing out,
and passengers begin missing connections while IndiGo, Air India, Akasa Air,
and SpiceJet compete for scarce recovery slots.

The agent is no longer solving a schedule. It is recovering a living system.

> Most agent benchmarks ask whether an LLM can make a plan. Runway Zero asks
> whether it can recover after the plan breaks.

## Three Difficulty Stages

| Stage | Focus | Core objective |
| --- | --- | --- |
| 1 | Operations | Minimize delays and avoid unsafe assignments |
| 2 | Passengers | Preserve connections and customer satisfaction |
| 3 | Economics + multi-agent | Balance efficiency, passenger impact, fairness, and airline cost |

## Repository Layout

```text
src/runway_zero/       Simulator, rewards, scenarios, server, baselines
scripts/               Evaluation, plotting, and replay export scripts
notebooks/             Colab-oriented training notebooks
web/                   Next.js visual replay dashboard
docs/                  Pitch, reward design, technical plan
results/               Generated traces and plots
openenv.yaml           Environment manifest
```

## Quick Start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python scripts/evaluate_baselines.py
python scripts/export_demo_trace.py
```

Train the local all-stage RL controller:

```bash
python scripts/train_rl_controller.py
python scripts/evaluate_baselines.py
python scripts/export_demo_trace.py
python scripts/make_plots.py
```

The generated plots and traces are committed under `results/` so judges can
inspect the evidence without rerunning everything.

Run the API:

```bash
uvicorn runway_zero.server:app --reload
```

Run the web dashboard:

```bash
cd web
npm install
npm run dev
```

The dashboard replays real simulator traces from `web/public/traces`. It supports
switching between base-model behavior and the environment-trained controller,
with model comparison rows for Gemma, GPT-OSS, Qwen2.5 Coder, and Qwen3.

## Scoring

The reward is decomposed into visible components:

- delay score
- safety score
- passenger score
- money score
- fairness score
- action validity score

This makes model improvement legible in the demo and in notebook plots.

## Results Snapshot

The current local baseline evaluation compares `random`, `fifo`,
`recovery_heuristic`, and `trained_rl` policies across all three stages. The
public demo emphasizes base-model vs RL-trained replay because that is the
cleanest judging story. Generated evidence:

- [total reward](results/plots/total_reward.png)
- [departure delay](results/plots/total_dep_delay.png)
- [stranded passengers](results/plots/stranded_passengers.png)
- [average satisfaction](results/plots/avg_satisfaction.png)

Replay traces:

- [FIFO Stage 2](results/traces/fifo_stage2_seed7.json)
- [Recovery Stage 2](results/traces/recovery_heuristic_stage2_seed7.json)

## Training

Notebook path:

- `notebooks/00_environment_smoke_test.ipynb`
- `notebooks/01_baseline_heuristics.ipynb`
- `notebooks/02_stage1_grpo_operations.ipynb`
- `notebooks/03_all_stage_rl_controller.ipynb`
- `notebooks/03_stage2_grpo_passenger_satisfaction.ipynb`
- `notebooks/04_stage3_multi_agent_economics.ipynb`
- `scripts/train_rl_controller.py`
- `scripts/train_llm_grpo_all_stages.py`
- `notebooks/04_llm_grpo_all_stages.ipynb`
- `notebooks/05_model_comparison.ipynb`
- `notebooks/06_demo_replay_export.ipynb`
- `scripts/run_hf_model_rollouts.py`

The GRPO notebook is a minimal Hugging Face TRL scaffold. It serializes Runway
Zero observations into prompts, parses model JSON actions, executes those actions
in the environment, and uses the returned environment reward as the training
signal.

The local RL controller trains saved policies for all three stages now. The
LLM GRPO entrypoint is environment-driven and ready for GPU runtimes:

```bash
pip install -r requirements-training.txt
python scripts/train_llm_grpo_all_stages.py \
  --model Qwen/Qwen2.5-Coder-7B-Instruct \
  --stages 1 2 3 \
  --max-steps 60 \
  --output-dir results/llm_runs/qwen25_runway_zero
```

Hosted model rollout comparison:

```bash
python scripts/run_hf_model_rollouts.py --model qwen-coder --stage 1 --max-steps 8
```

This repo also includes a completed local TRL/GRPO smoke run summary:
`results/llm_runs/tiny_grpo_smoke_summary.json`. The full adapter files are
intentionally ignored because they are generated binary artifacts.

Hosted GPU GRPO evidence:

- `results/llm_runs/hf_qwen25_coder_7b_grpo_summary.json`
- Artifact bundle: `work-dwivediishivam/runway-zero-training-artifacts/qwen25_coder_7b_hf_grpo/runway_zero_qwen25_coder_7b_hf_grpo.tgz`

## Docs

- [Technical plan](docs/TECHNICAL_PLAN.md)
- [Reward design](docs/REWARD_DESIGN.md)
- [Training plan](docs/TRAINING.md)
- [Pitch](docs/PITCH.md)
- [Mini-blog](docs/MINI_BLOG.md)
- [Submission checklist](docs/SUBMISSION.md)
