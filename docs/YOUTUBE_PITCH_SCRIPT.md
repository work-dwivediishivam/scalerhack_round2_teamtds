# Two-Minute YouTube Pitch Script

## Recording Setup

- Main screen: Runway Zero web demo at https://project-2pdc2.vercel.app/
- Primary replay: Level 4 at https://project-2pdc2.vercel.app/sim/?stage=4
- Evidence screen: https://project-2pdc2.vercel.app/training/
- Optional overlay: OpenMonopoly India replay at https://frontend-one-beta-84.vercel.app
- Keep the overlay small, around the top-right or bottom-right corner, so the
  Runway Zero map remains readable.

## Script

### 0:00 - 0:12

Hi, I am Shivam Dwivedi, and this is Runway Zero, our submission for the Meta
PyTorch OpenEnv Hackathon with Scaler School of Technology.

Before the real demo starts, if you are watching this with Gen Z attention span,
there is also an RL Monopoly game running on the side. That is a separate
OpenEnv project we trained for fun. The main submission is the airport
recovery environment you are about to see.

### 0:12 - 0:28

Most agent benchmarks ask whether an LLM can make a plan.

Runway Zero asks a harder question: can an LLM recover after the plan breaks?

At 8 AM the Indian airport network looks stable. Then fog hits Delhi, Mumbai
loses runway capacity, Bengaluru gates jam, crews start timing out, passenger
connections break, and airlines fight for scarce recovery slots.

In real life, this job requires highly trained operations-control teams. They
have software for pieces of the workflow, but there is no generally deployed
autonomous system that recovers aircraft, crews, passengers, gates, runways,
money, and fairness end to end.

### 0:28 - 0:48

This is an OpenEnv environment. The model does not just write an explanation. It
observes structured airport state, emits a JSON action, the environment executes
that action, and the reward comes from what actually happened.

The reward has separate channels for delay, safety, passengers, money, fairness,
and valid actions. So the model cannot win by moving flights quickly while
breaking crew legality or stranding passengers.

### 0:48 - 1:08

The demo has four levels.

Level 1 is operations recovery.
Level 2 adds passenger satisfaction and missed connections.
Level 3 adds airline economics and multi-agent negotiation.
Level 4 is an IndiGo-style cancellation crisis replay inspired by a real class
of crew availability breakdowns.

On the map you can see live flights, airport disruption markers, the selected
airport zoom, airline cash pressure, and the conversation between tower control
and airline agents.

### 1:08 - 1:28

Now watch the important comparison.

For each crisis, we compare the same four base LLMs against RL-trained versions:
Qwen2.5 Coder 7B, Qwen3 14B, Gemma 4 31B, and GPT-OSS 120B.

The base model reacts late. It over-holds aircraft, misses crew constraints, and
lets cancellations cascade.

The RL-trained controller still faces delays, because this is a real crisis, but
it protects more connections, cancels fewer flights, and keeps the network
alive.

### 1:28 - 1:48

Here is the training evidence.

Across the shipped evaluation, average Recovery Score improves from 26.1 for
base LLMs to 86.2 after RL training.

Total delay minutes drop from 176,157 to 16,823.

Cancelled flights drop from 1,827 to 393.

Passenger satisfaction rises from 51.7 percent to 82.0 percent.

The Hugging Face Space, training notebook, GRPO artifacts, plots, and full blog
post are all linked in the description.

### 1:48 - 2:00

The core claim is simple.

Base LLMs can describe airport chaos. RL-trained LLMs can learn to recover it.

That is Runway Zero: an OpenEnv benchmark for cascading airport recovery.
