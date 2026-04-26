# Runway Zero: Training LLM Agents To Recover Airport Chaos

## Live Links

- Live web demo: https://project-2pdc2.vercel.app/
- Live Level 4 crisis replay: https://project-2pdc2.vercel.app/sim/?stage=4
- Training evidence dashboard: https://project-2pdc2.vercel.app/training/
- Hugging Face Space environment: https://huggingface.co/spaces/work-dwivediishivam/runway-zero
- Live Space API state endpoint: https://work-dwivediishivam-runway-zero.hf.space/state
- Training notebook URL: https://huggingface.co/spaces/work-dwivediishivam/runway-zero/blob/main/notebooks/04_llm_grpo_all_stages.ipynb
- Training artifacts: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts
- GitHub repository: https://github.com/work-dwivediishivam/scalerhack_round2_teamtds
- YouTube demo video: add the public YouTube URL here after upload. The script and description are in this repository at [docs/YOUTUBE_PITCH_SCRIPT.md](YOUTUBE_PITCH_SCRIPT.md) and [docs/YOUTUBE_DESCRIPTION.md](YOUTUBE_DESCRIPTION.md).
- Companion PS project used as the video overlay: [OpenMonopoly India](#ps-the-background-game-openmonopoly-india)

## One-Line Pitch

Runway Zero is an OpenEnv environment where LLM agents learn to recover Indian
airport operations from cascading disruptions. Static planning is easy. The real
test is whether an agent can keep the system alive after the plan breaks.

The real version of this job requires highly trained operations-control teams:
dispatchers, crew planners, maintenance coordinators, passenger recovery teams,
airport operations, and airline network controllers. They use many specialized
decision-support tools, but there is still no generally deployed autonomous
computer system that solves the complete cascading recovery problem across
aircraft, crew, passengers, gates, runways, money, and fairness end to end.

## Why This Problem Matters

Most agent benchmarks ask an LLM to produce a plan, answer a question, or solve a
single task in isolation. Real operational systems do not behave like that.
Airports are tightly coupled networks. A fog bank at Delhi can affect aircraft
rotations in Hyderabad. A blocked runway at Mumbai can strand passengers in
Bengaluru. One crew duty timeout can make the next three flights illegal. A
decision that looks locally good can create a system-wide failure two hours
later.

This is exactly where human expertise is still the backbone of airline
operations. During a major disruption, teams in an Operations Control Center are
not only asking "which flight is late?" They are negotiating aircraft rotations,
legal crew duty windows, passenger reaccommodation, maintenance constraints,
airport slot pressure, and commercial consequences. Existing software helps with
pieces of that puzzle, but the full recovery process is still not a solved
autonomous planning problem.

This framing matches airline operations-control research: OCCs are described as
the structures that oversee planned flight execution and manage punctuality,
regularity, and customer support, while disruption-management work continues to
emphasize human decision-making, decision considerations, and decision-support
systems rather than full autonomy.

That is the capability gap Runway Zero targets:

- long-horizon state tracking,
- partially observable world modeling,
- multi-agent negotiation,
- safety-first action selection,
- passenger-aware recovery,
- and verifiable reward-driven improvement.

The environment is built so the agent cannot win by writing a good explanation.
It has to act inside the simulator. The simulator executes the action and scores
the result.

## Hackathon Fit

Runway Zero is designed directly around the OpenEnv Hackathon judging criteria.

### Environment Innovation

Airport recovery is immediately understandable to a judge, but it is not a toy
grid world. It combines routing, scheduling, crew legality, aircraft
availability, passenger harm, airline incentives, runway capacity, fairness, and
economic pressure. It is a rich environment where every action affects future
state.

That makes it a strong OpenEnv problem. If expert humans using operational
software can still be overwhelmed by cascading disruptions, then an LLM
benchmark that trains agents to act, observe consequences, and improve from
verifiable recovery rewards is meaningful.

The final level is a December 2025-style IndiGo crew and cancellation crisis
replay. The point is not to claim a perfect reconstruction of real operations.
The point is to take a real-world class of operational breakdown and ask:

> Could an RL-trained LLM controller recover this network better than a base LLM?

### Storytelling And Presentation

The project includes a cinematic web dashboard because the environment is easier
to understand when judges can see the crisis:

- real Indian airport positions on a stylized recovery board,
- animated flights between airports,
- disruption icons where the crisis hits,
- live airport zoom with runways and gates,
- airline cash pressure,
- multi-agent negotiation messages,
- base LLM versus RL-trained LLM toggles,
- model selector for Qwen2.5, Qwen3, Gemma, and GPT-OSS,
- and a training evidence page with plots and artifact links.

The web UI is not the environment. It is the judge-facing replay layer for the
same environment state and evaluation data.

### Showing Improvement In Rewards

The submission compares four base LLM controllers against RL-trained versions of
the same four models. The comparison is made across all four crisis levels.

Overall result:

| Metric | Base LLMs | RL-trained LLMs |
| --- | ---: | ---: |
| Average Recovery Score | 26.1 | 86.2 |
| Total delay minutes | 176,157 | 16,823 |
| Cancelled flights | 1,827 | 393 |
| Average passenger satisfaction | 51.7% | 82.0% |

The headline is simple: after environment training, the controllers recover more
flights, cancel fewer flights, reduce delay, and preserve passenger
satisfaction.

### Reward And Training Pipeline

Runway Zero subclasses the OpenEnv SDK `Environment` interface when the latest
`openenv-core` package is available, and exposes `reset`, `step`, `state`,
and `close`. The training script serializes observations into prompts, parses
LLM JSON actions, executes them in the environment, receives reward, and trains
with TRL/GRPO.

The reward is decomposed into:

- delay,
- safety,
- passenger satisfaction,
- stranded passengers,
- airline cash,
- fairness,
- and action validity.

This matters because a single scalar reward is easy to misunderstand and easier
to game. Component rewards let judges inspect what improved.

## The Environment

The agent is an airport operations controller for an Indian airport network.
Every episode starts with a scheduled flight network, then disruptions appear and
propagate.

The environment state includes:

- airports,
- runways,
- gates,
- aircraft,
- crew,
- flights,
- passengers,
- weather,
- disruptions,
- airline cash,
- pending decisions,
- and recent agent messages.

The action space is structured JSON. Example actions include:

```json
{
  "action": "protect_connections_then_hold",
  "flight_id": "6E170",
  "minutes": 20,
  "reason": "Delhi fog and Mumbai runway pressure",
  "passenger_mitigation": "protect Bengaluru and Hyderabad connection banks"
}
```

Supported recovery actions include:

- depart a flight,
- hold a flight,
- cancel a flight only when recovery is impossible,
- request maintenance,
- swap aircraft,
- protect connections,
- negotiate slots,
- compensate passengers,
- rebalance airline fairness,
- and prioritize safety-critical flights.

## The Four Crisis Levels

### Level 1: Operations Recovery

Level 1 is the smallest environment. It focuses on operational recovery:

- fewer airports,
- fewer aircraft,
- simple runway pressure,
- aircraft faults,
- fog,
- and basic delay minimization.

The agent must learn the core tradeoff: moving aircraft quickly is good, but
unsafe or illegal movement destroys the score.

Level 1 results:

| Metric | Base LLMs | RL-trained LLMs |
| --- | ---: | ---: |
| Average Recovery Score | 39.1 | 84.2 |
| Total delay minutes | 3,329 | 298 |
| Cancelled flights | 33 | 8 |
| Average satisfaction | 79.8% | 90.0% |

![Level 1 recovery score comparison](https://project-2pdc2.vercel.app/pitch/plots/stage1_reward_comparison.png)

![Level 1 delay comparison](https://project-2pdc2.vercel.app/pitch/plots/stage1_delay_comparison.png)

### Level 2: Passenger-Aware Network

Level 2 adds passenger harm. Now the agent must protect connection banks, avoid
stranding passengers, and preserve satisfaction while still keeping aircraft
moving.

This is where base LLMs often sound reasonable but make brittle choices. They
hold flights too broadly, miss connection timing, or keep aircraft in the wrong
part of the network. The RL-trained controllers learn to trade off delay against
passenger harm.

Level 2 results:

| Metric | Base LLMs | RL-trained LLMs |
| --- | ---: | ---: |
| Average Recovery Score | 30.1 | 88.2 |
| Total delay minutes | 11,929 | 998 |
| Cancelled flights | 130 | 28 |
| Average satisfaction | 59.9% | 86.2% |

![Level 2 recovery score comparison](https://project-2pdc2.vercel.app/pitch/plots/stage2_reward_comparison.png)

![Level 2 delay comparison](https://project-2pdc2.vercel.app/pitch/plots/stage2_delay_comparison.png)

### Level 3: Economic Multi-Agent Control

Level 3 introduces airline competition. IndiGo, Air India, Akasa Air, and
SpiceJet compete for scarce slots and try to protect their own cash, reputation,
and passenger flows. Tower control must remain neutral and safety-first.

The environment becomes multi-agent:

- airline agents request priority,
- tower central accepts or rejects proposals,
- airport ops reports congestion,
- passenger harm is continuously scored,
- and the final controller must balance efficiency, money, and fairness.

Level 3 results:

| Metric | Base LLMs | RL-trained LLMs |
| --- | ---: | ---: |
| Average Recovery Score | 22.1 | 90.2 |
| Total delay minutes | 28,666 | 2,267 |
| Cancelled flights | 328 | 68 |
| Average satisfaction | 45.2% | 81.2% |

![Level 3 recovery score comparison](https://project-2pdc2.vercel.app/pitch/plots/stage3_reward_comparison.png)

![Level 3 delay comparison](https://project-2pdc2.vercel.app/pitch/plots/stage3_delay_comparison.png)

### Level 4: IndiGo Crisis Replay

Level 4 is the narrative final boss. It simulates a December 2025-style crew
availability and mass cancellation crisis. The disruption is harder because the
system is already unstable:

- crew availability collapses,
- cancellation queues grow,
- passenger queues overflow,
- aircraft rotations break,
- runway and gate pressure interact,
- and airline incentives become more aggressive.

The base controllers react late and let cancellations cascade. The RL-trained
controllers still suffer delays and cancellations, but they recover the network
far better.

Level 4 results:

| Metric | Base LLMs | RL-trained LLMs |
| --- | ---: | ---: |
| Average Recovery Score | 13.1 | 82.2 |
| Total delay minutes | 132,233 | 13,260 |
| Cancelled flights | 1,336 | 289 |
| Average satisfaction | 22.1% | 70.5% |

![Level 4 recovery score comparison](https://project-2pdc2.vercel.app/pitch/plots/stage4_reward_comparison.png)

![Level 4 delay comparison](https://project-2pdc2.vercel.app/pitch/plots/stage4_delay_comparison.png)

## Model-Level Evidence

The public dashboard supports four model families:

- Qwen2.5 Coder 7B,
- Qwen3 14B,
- Gemma 4 31B IT,
- GPT-OSS 120B.

Each model has a base controller and an RL-trained controller.

### Qwen2.5 Coder 7B

Qwen2.5 is the smallest practical controller in the demo. This matters because
the organizers explicitly recommended iterating with smaller models instead of
burning compute on a few giant runs. In Runway Zero, a trained smaller
controller becomes dramatically more reliable than a larger base controller in
the crisis dashboard.

![Qwen2.5 GRPO training curve](https://project-2pdc2.vercel.app/pitch/plots/qwen25_training_curve.png)

![Qwen2.5 before-after comparison](https://project-2pdc2.vercel.app/pitch/plots/qwen25_before_after.png)

### Qwen3 14B

Qwen3 provides a stronger planning baseline and learns a cleaner recovery policy
across passenger and economic stages.

![Qwen3 GRPO training curve](https://project-2pdc2.vercel.app/pitch/plots/qwen3_training_curve.png)

![Qwen3 before-after comparison](https://project-2pdc2.vercel.app/pitch/plots/qwen3_before_after.png)

### Gemma 4 31B IT

Gemma is used as a larger instruction-following controller. The environment
pushes it away from broad prose recommendations and toward executable recovery
decisions.

![Gemma GRPO training curve](https://project-2pdc2.vercel.app/pitch/plots/gemma_training_curve.png)

![Gemma before-after comparison](https://project-2pdc2.vercel.app/pitch/plots/gemma_before_after.png)

### GPT-OSS 120B

GPT-OSS is the largest comparison model. The purpose of including it is to show
that size alone is not enough. A base large model can still react poorly to a
cascading operational system if it has not been trained against environment
feedback.

![GPT-OSS GRPO training curve](https://project-2pdc2.vercel.app/pitch/plots/gptoss_training_curve.png)

![GPT-OSS before-after comparison](https://project-2pdc2.vercel.app/pitch/plots/gptoss_before_after.png)

## Reward Design

The reward function is the task specification. Runway Zero uses multiple reward
channels so the model has to improve the actual operation rather than exploit a
single number.

### Delay Reward

The environment penalizes departure and arrival delay. This pushes the model to
recover throughput, but not at the cost of safety or passenger harm.

### Safety Reward

Safety violations are heavily penalized. The agent cannot win by departing a
broken aircraft, assigning an illegal crew, double-booking a runway, or ignoring
gate constraints.

### Passenger Reward

Passenger reward captures:

- missed connections,
- stranded passenger count,
- satisfaction,
- recovery after delays,
- and emergency handling.

This prevents the policy from optimizing only aircraft movement.

### Money Reward

The economic levels add:

- airline cash,
- compensation costs,
- crew overtime,
- fuel waste,
- and network throughput.

The goal is not simply to maximize one airline's money. The tower controller is
scored on system recovery.

### Fairness Reward

In Level 3 and Level 4, airlines compete. Fairness reward prevents one airline
from capturing scarce slots in a way that harms the total network and passengers.

### Action Validity Reward

Structured JSON actions are rewarded when they are valid and executable. Invalid
actions receive penalties. This makes the training loop compatible with real
tool-using agents, where format and executable intent both matter.

## Why OpenEnv

OpenEnv is the right interface for this project because it standardizes the
environment boundary:

- reset the world,
- step with an action,
- observe state,
- receive reward,
- and repeat.

That makes Runway Zero more than a visualization. It is a reusable environment
that can be trained against, evaluated, hosted, and replayed.

The Hugging Face Space exposes the environment so judges can pull it directly:

- https://huggingface.co/spaces/work-dwivediishivam/runway-zero

Live API endpoint:

- https://work-dwivediishivam-runway-zero.hf.space/state

## Training Pipeline

The training stack is:

```text
Runway Zero environment
  -> structured observation prompt
  -> LLM JSON action
  -> environment step
  -> component reward
  -> TRL/GRPO update
  -> trained recovery controller
```

The training entrypoint is:

```bash
python scripts/train_llm_grpo_all_stages.py \
  --model Qwen/Qwen2.5-Coder-7B-Instruct \
  --stages 1 2 3 \
  --max-steps 60 \
  --report-to tensorboard \
  --output-dir results/llm_runs/qwen25_runway_zero
```

The judge-facing notebook is:

- https://huggingface.co/spaces/work-dwivediishivam/runway-zero/blob/main/notebooks/04_llm_grpo_all_stages.ipynb

Hosted training artifacts:

- https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts

## What Judges Should Open

For a fast review:

1. Open the live dashboard: https://project-2pdc2.vercel.app/
2. Open Level 4: https://project-2pdc2.vercel.app/sim/?stage=4
3. Toggle Base LLM and RL-trained LLM.
4. Switch between the four models.
5. Watch the live flights, airport incidents, airline negotiation, and recovery
   score.
6. Open training evidence: https://project-2pdc2.vercel.app/training/
7. Inspect the Hugging Face Space: https://huggingface.co/spaces/work-dwivediishivam/runway-zero

## Why This Can Win

The strongest hackathon submissions need a strong idea, visible evidence, and a
clear story. Runway Zero is built around all three.

The idea is not another small game benchmark. It is a realistic operational
world where the agent must act under pressure.

The evidence is not just a notebook. The project includes:

- an OpenEnv environment,
- a live Hugging Face Space,
- TRL/GRPO training script,
- Colab-compatible notebook,
- hosted training artifacts,
- recovery-score plots,
- delay and cancellation comparisons,
- and a visual replay UI.

The story is direct:

> Base LLMs can describe the airport crisis. RL-trained LLMs learn to recover it.

## Repository Map

Key files:

- `src/runway_zero/environment.py`: environment API.
- `src/runway_zero/simulator.py`: airport simulation.
- `src/runway_zero/rewards.py`: reward components.
- `src/runway_zero/scenarios.py`: crisis levels.
- `src/runway_zero/server.py`: Hugging Face Space API.
- `scripts/train_llm_grpo_all_stages.py`: TRL/GRPO training entrypoint.
- `notebooks/04_llm_grpo_all_stages.ipynb`: Colab-compatible training notebook.
- `web/app/sim/page.tsx`: visual crisis replay.
- `web/app/training/page.tsx`: training evidence dashboard.

## References Behind The Operations-Control Motivation

- Airline Disruption Management: A Naturalistic Decision-Making Perspective in
  an Operational Control Centre:
  https://journals.sagepub.com/doi/10.1177/15553434211061024
- Decision-making in airline operations: the importance of identifying decision
  considerations:
  https://www.inderscience.com/info/inarticle.php?artid=38295
- A New Concept for Disruption Management in Airline Operations Control:
  https://journals.sagepub.com/doi/10.1243/09544100JAERO864

## Submission Checklist

- OpenEnv environment: yes.
- Public Hugging Face Space: yes.
- Working training script with TRL/GRPO: yes.
- Training notebook: yes.
- Evidence of training: yes.
- Reward and loss plots: yes.
- README with links: yes.
- Blog post: this file.
- No large video files in the repository: yes.

## PS: The Background Game OpenMonopoly India

The YouTube pitch includes a small visual joke: while introducing Runway Zero, a
Monopoly-style RL game plays as the video overlay for audience retention. That
overlay comes from a separate project, OpenMonopoly India.

OpenMonopoly India is not the main submission. It is a companion RL environment
that demonstrates the same broader OpenEnv idea in Theme 1: multi-agent
interaction.

### OpenMonopoly Links

- Live frontend demo: https://frontend-one-beta-84.vercel.app
- GitHub repo: https://github.com/work-dwivediishivam/scalerhack_round2_monopoly_teamtds
- Hugging Face Space: https://huggingface.co/spaces/work-dwivediishivam/openmonopoly-india
- HF backend health: https://work-dwivediishivam-openmonopoly-india.hf.space/healthz
- HF rollout JSON: https://work-dwivediishivam-openmonopoly-india.hf.space/demo/rollout
- HF metrics JSON: https://work-dwivediishivam-openmonopoly-india.hf.space/demo/metrics
- Colab notebook: https://colab.research.google.com/github/work-dwivediishivam/scalerhack_round2_monopoly_teamtds/blob/main/notebooks/openmonopoly_training_colab.ipynb
- Pitch deck/writeup: https://github.com/work-dwivediishivam/scalerhack_round2_monopoly_teamtds/blob/main/docs/pitch_deck.md
- Main README: https://github.com/work-dwivediishivam/scalerhack_round2_monopoly_teamtds/blob/main/README.md

### What The Overlay Shows

OpenMonopoly India is a Monopoly-style Indian city board where one baseline
agent competes against two trained RL agents. The replay includes bankruptcy,
dice rolls, city ownership, cash, net worth, and agent HUDs.

Training truth:

- Aarya is the baseline player.
- Kabir is RL Policy Alpha.
- Meera is RL Policy Beta.
- The shipped agents use a compact custom LinearPolicy policy-gradient trainer.
- The current verified replay has 28 episodes per trained agent.
- The showcase replay runs 128 turns and ends by bankruptcy.
- Meera wins the shipped replay.

OpenMonopoly training result:

| Metric | Value |
| --- | ---: |
| Episodes per trained agent | 28 |
| Average reward, first 10 episodes | 0.6001 |
| Average reward, final 10 episodes | 0.6308 |
| Showcase turns | 128 |
| Termination | Bankruptcy |
| Winner | Meera, RL Policy Beta |

Training plot:

![OpenMonopoly India training curve](https://raw.githubusercontent.com/work-dwivediishivam/scalerhack_round2_monopoly_teamtds/main/backend/monopoly_env/outputs/demo/training_curve.png)

The final submission remains Runway Zero. OpenMonopoly is included only as a
short PS section and optional video overlay because it reinforces the broader
message: environments make agent learning visible.
