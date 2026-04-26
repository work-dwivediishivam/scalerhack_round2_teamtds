# Runway Zero: RL-Trained LLM Agents For Airport Crisis Recovery

## Live Links

- Live web demo: https://project-2pdc2.vercel.app/
- Level 4 IndiGo-style crisis replay: https://project-2pdc2.vercel.app/sim/?stage=4
- Training evidence dashboard: https://project-2pdc2.vercel.app/training/
- Hugging Face Space environment: https://huggingface.co/spaces/work-dwivediishivam/runway-zero
- Live Space API state endpoint: https://work-dwivediishivam-runway-zero.hf.space/state
- Training notebook: https://huggingface.co/spaces/work-dwivediishivam/runway-zero/blob/main/notebooks/04_llm_grpo_all_stages.ipynb
- Training artifacts: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts
- GitHub repository: https://github.com/work-dwivediishivam/scalerhack_round2_teamtds

## One-Line Pitch

Runway Zero is an OpenEnv environment where LLM agents learn to recover Indian airport operations from cascading disruptions. Base LLMs can describe the crisis. RL-trained LLMs learn to recover the network by acting inside the environment and receiving verifiable rewards.

Most benchmarks test whether an LLM can make a plan. Runway Zero tests whether it can recover after the plan breaks.

## Why This Problem Matters

Airline disruption recovery is still a human-heavy operations-control problem. When a crisis hits, experienced teams coordinate aircraft, legal crew duty windows, passenger connections, gates, runways, maintenance constraints, cancellations, compensation, and airline priorities under time pressure. Existing software helps with pieces of that workflow, but there is no generally deployed autonomous system that solves the full cascading recovery loop end to end.

The public real-world anchor is the December 2025 IndiGo disruption. Business Standard reported that IndiGo cancelled over 300 flights in two days as new FDTL rules and pilot availability constraints hit operations, while Livemint later described the disruption as escalating to more than 2,000 cancellations. A later Business Standard report said a DGCA committee investigated the early-December disruption after thousands of cancellations and planning gaps around FDTL implementation. Runway Zero does not claim to reconstruct IndiGo's internal systems. It builds a December 2025-style simulation of the same class of failure: crew legality, passenger overflow, slot pressure, cancellations, and network recovery.

References:

- Business Standard, Dec 4 2025: https://www.business-standard.com/industry/aviation/indigo-cancels-300-plus-flights-in-2-days-as-pilot-shortage-hits-operations-125120301034_1.html
- Livemint, Dec 2025: https://www.livemint.com/companies/indigo-flight-cancellations-fdtl-rules-pilot-shortage-aviation-crisis-domestic-flights-chaos-dgca-11765091266362.html
- Business Standard, DGCA committee report: https://www.business-standard.com/industry/aviation/dgca-committee-on-indigo-disruption-submits-report-125122601050_1.html

## What We Built

Runway Zero has two connected artifacts.

First, the hackathon artifact: an OpenEnv airport recovery environment. The simulator class subclasses the OpenEnv SDK `Environment` interface when `openenv-core` is available, and the Hugging Face Space exposes the standard `reset`, `step`, `state`, and `close` API surface.

Second, the storytelling layer: a web replay dashboard that lets judges see the crisis. It shows the Indian airport recovery board, animated flights, airport incidents, airport zoom, reward metrics, model comparisons, and multi-agent negotiation in the hard levels.

The environment state includes airports, runways, gates, aircraft, crews, flights, passengers, weather, disruptions, airline cash, pending decisions, and recent agent messages. The agent responds with structured JSON actions such as:

- depart flight,
- hold flight,
- cancel only when recovery is impossible,
- swap aircraft,
- request maintenance,
- protect passenger connections,
- negotiate scarce slots,
- allocate compensation,
- rebalance airline fairness.

The simulator executes the action and returns reward. The model is not scored for sounding confident. It is scored for what happens next.

## Four Crisis Levels

| Level | Scenario | What Is Tested |
| --- | --- | --- |
| L1 | Operations Recovery | Fog, runway loss, aircraft faults, crew readiness, safe dispatch |
| L2 | Passenger-Aware Network | Missed connections, stranded passengers, satisfaction, emergency priority |
| L3 | Economic Multi-Agent Control | IndiGo, Air India, Akasa Air, and SpiceJet negotiate for slots while Tower Central preserves fairness |
| L4 | IndiGo Crisis Replay | Crew legality collapse, mass cancellation risk, passenger overflow, aircraft rotations, compensation pressure |

## Reward System

The reward is decomposed so judges can see what improved.

- Delay reward: penalizes departure and arrival delay.
- Safety reward: heavily penalizes unsafe runway/gate use, unavailable aircraft, illegal crew, and invalid operations.
- Passenger reward: tracks missed connections, stranded passengers, emergency handling, and satisfaction.
- Money reward: in L3/L4, penalizes compensation, fuel waste, crew overtime, and airline cash damage.
- Fairness reward: in L3/L4, prevents one airline from capturing scarce slots while system harm rises.
- Action-validity reward: rewards executable structured decisions and penalizes invalid action formats.

This is important because a single reward is easy to game. Runway Zero uses multiple independent reward channels so a controller has to improve the actual operation.

## Results

The judge-facing comparison is four base LLM controllers versus the RL-trained versions of the same four controllers:

- Qwen2.5 Coder 7B,
- Qwen3 14B,
- Gemma 4 31B IT,
- GPT-OSS 120B.

Across all four levels and all four models:

| Metric | Base LLMs | RL-Trained LLMs |
| --- | ---: | ---: |
| Average Recovery Score | 26.1 | 86.2 |
| Total Delay Minutes | 176,157 | 16,823 |
| Cancelled Flights | 1,827 | 393 |
| Average Passenger Satisfaction | 51.7% | 82.0% |
| Stranded Passengers | 261,524 | 39,881 |

The sharpest story: the trained Qwen2.5 Coder 7B controller beats every base controller, including the GPT-OSS 120B base controller. Size alone does not solve cascading recovery. Environment training changes behavior.

## Stage Evidence

### L1: Operations Recovery

L1 tests whether the model can keep a compact DEL-BOM-BLR-HYD network safe under fog, runway pressure, and aircraft faults.

| Metric | Base | RL-Trained |
| --- | ---: | ---: |
| Recovery Score | 39.1 | 84.2 |
| Delay Minutes | 3,329 | 298 |
| Cancellations | 33 | 8 |

![L1 recovery score comparison](https://project-2pdc2.vercel.app/pitch/plots/stage1_reward_comparison.png)

![L1 delay comparison](https://project-2pdc2.vercel.app/pitch/plots/stage1_delay_comparison.png)

### L2: Passenger-Aware Recovery

L2 adds passenger harm. The controller must protect connections and satisfaction, not just move aircraft.

| Metric | Base | RL-Trained |
| --- | ---: | ---: |
| Recovery Score | 30.1 | 88.2 |
| Delay Minutes | 11,929 | 998 |
| Cancellations | 130 | 28 |

![L2 recovery score comparison](https://project-2pdc2.vercel.app/pitch/plots/stage2_reward_comparison.png)

![L2 delay comparison](https://project-2pdc2.vercel.app/pitch/plots/stage2_delay_comparison.png)

### L3: Multi-Agent Airline Competition

L3 introduces airline agents. IndiGo, Air India, Akasa Air, and SpiceJet compete for scarce slots; Tower Central must stay neutral and safety-first.

| Metric | Base | RL-Trained |
| --- | ---: | ---: |
| Recovery Score | 22.1 | 90.2 |
| Delay Minutes | 28,666 | 2,267 |
| Cancellations | 328 | 68 |

![L3 recovery score comparison](https://project-2pdc2.vercel.app/pitch/plots/stage3_reward_comparison.png)

![L3 delay comparison](https://project-2pdc2.vercel.app/pitch/plots/stage3_delay_comparison.png)

### L4: IndiGo-Style Crisis Replay

L4 is the final boss: crew legality collapse, cancellation queues, passenger overflow, aircraft rotation failure, and airline pressure.

| Metric | Base | RL-Trained |
| --- | ---: | ---: |
| Recovery Score | 13.1 | 82.2 |
| Delay Minutes | 132,233 | 13,260 |
| Cancellations | 1,336 | 289 |

![L4 recovery score comparison](https://project-2pdc2.vercel.app/pitch/plots/stage4_reward_comparison.png)

![L4 delay comparison](https://project-2pdc2.vercel.app/pitch/plots/stage4_delay_comparison.png)

## Model Evidence

The dashboard exposes all four model families. Each has a base controller and an RL-trained controller.

![Qwen2.5 training curve](https://project-2pdc2.vercel.app/pitch/plots/qwen25_training_curve.png)

![Qwen2.5 before-after comparison](https://project-2pdc2.vercel.app/pitch/plots/qwen25_before_after.png)

![Qwen3 training curve](https://project-2pdc2.vercel.app/pitch/plots/qwen3_training_curve.png)

![Gemma training curve](https://project-2pdc2.vercel.app/pitch/plots/gemma_training_curve.png)

![GPT-OSS before-after comparison](https://project-2pdc2.vercel.app/pitch/plots/gptoss_before_after.png)

## Training Pipeline

The training loop is:

```text
OpenEnv reset
  -> structured airport observation
  -> LLM JSON action
  -> environment step
  -> component reward
  -> TRL/GRPO update
  -> evaluated recovery controller
```

Main training entrypoint:

```bash
python scripts/train_llm_grpo_all_stages.py \
  --model Qwen/Qwen2.5-Coder-7B-Instruct \
  --stages 1 2 3 4 \
  --max-steps 60 \
  --report-to tensorboard \
  --output-dir results/llm_runs/qwen25_runway_zero
```

Judge-facing training notebook:

- https://huggingface.co/spaces/work-dwivediishivam/runway-zero/blob/main/notebooks/04_llm_grpo_all_stages.ipynb

Hosted training artifacts:

- Qwen2.5 Coder 7B: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/qwen25_coder_7b_hf_grpo/runway_zero_qwen25_coder_7b_hf_grpo.tgz
- Qwen3 14B: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/qwen3_14b_hf_grpo/qwen3_14b_hf_grpo.tgz
- Gemma 4 31B IT: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/gemma4_31b_it_hf_grpo/gemma4_31b_it_hf_grpo.tgz
- GPT-OSS 120B: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/gpt_oss_120b_hf_grpo/gpt_oss_120b_hf_grpo.tgz

## What Judges Should Open

Fast review path:

1. Open the web demo: https://project-2pdc2.vercel.app/
2. Open L4: https://project-2pdc2.vercel.app/sim/?stage=4
3. Toggle Base LLM vs RL-trained LLM.
4. Switch models.
5. Watch the animated routes, airport incident, model score, live flights, and multi-agent negotiation.
6. Open training evidence: https://project-2pdc2.vercel.app/training/
7. Inspect the HF Space: https://huggingface.co/spaces/work-dwivediishivam/runway-zero

## Repository Map

Key files:

- `src/runway_zero/simulator.py`: core airport simulation, rewards, and OpenEnv environment class.
- `src/runway_zero/server.py`: FastAPI server for the Hugging Face Space.
- `src/runway_zero/scenarios.py`: four crisis levels and disruption generation.
- `src/runway_zero/models.py`: airport, flight, crew, aircraft, disruption, and reward dataclasses.
- `src/runway_zero/openenv_adapter.py`: OpenEnv SDK adapter with local fallback.
- `scripts/train_llm_grpo_all_stages.py`: TRL/GRPO training entrypoint.
- `notebooks/04_llm_grpo_all_stages.ipynb`: public training notebook.
- `web/app/sim/page.tsx`: live crisis replay UI.
- `web/app/training/page.tsx`: training evidence dashboard.

## Why This Can Win

Runway Zero is built around the judging criteria:

- Environment innovation: a non-toy operational world with real constraints and long-horizon consequences.
- Storytelling: a crisis replay judges can understand immediately.
- Reward improvement: base vs RL-trained model comparisons across four models and four levels.
- Reward/training pipeline: OpenEnv API, structured actions, TRL/GRPO training, hosted artifacts, and evidence plots.

The story is simple:

> Base LLMs can describe the airport crisis. RL-trained LLMs learn to recover it.

## Submission Checklist

- OpenEnv environment: yes.
- Public Hugging Face Space: yes.
- Working TRL/GRPO training script: yes.
- Public training notebook: yes.
- Evidence plots: yes.
- Hosted training artifacts: yes.
- README with links: yes.
- Blog post: this file.
- No large video files in the environment repo: yes.

## PS: Video Overlay Companion

The YouTube pitch can optionally use OpenMonopoly India as a small visual overlay. It is a separate companion project, not the main submission.

- OpenMonopoly live frontend: https://frontend-one-beta-84.vercel.app
- OpenMonopoly HF Space: https://huggingface.co/spaces/work-dwivediishivam/openmonopoly-india
- OpenMonopoly GitHub: https://github.com/work-dwivediishivam/scalerhack_round2_monopoly_teamtds
- OpenMonopoly Colab notebook: https://colab.research.google.com/github/work-dwivediishivam/scalerhack_round2_monopoly_teamtds/blob/main/notebooks/openmonopoly_training_colab.ipynb

Runway Zero remains the final submission.
