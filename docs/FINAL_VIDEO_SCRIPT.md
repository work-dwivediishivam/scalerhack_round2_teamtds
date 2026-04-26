# Runway Zero Final Video Script

Target length: 1:50-2:05  
Tone: fast, confident, judge-facing  
Primary goal: make the project feel like a serious OpenEnv training environment, not only a UI demo.

## Slide 1 — Title

Hi, I am Shivam Dwivedi from Team TDS, and this is Runway Zero.

Runway Zero trains LLM agents to recover Indian airport operations when the plan breaks.

Most agent benchmarks test whether a model can make a plan. We wanted to test something much harder: can a model recover a live airport network after fog, crew limits, runway failures, passenger delays, and airline conflicts start cascading together?

## Slide 2 — Builder

I am an AI engineer at Samsung Research, from IIIT Delhi, and I have worked across research, engineering, and hackathon-scale AI systems.

For this hackathon, I wanted to build something that is not just a notebook, but a real environment, a real training loop, and a demo that makes the problem obvious in seconds.

## Slide 3 — Problem

Airline disruption recovery is still heavily dependent on highly trained operations-control teams.

When a crisis hits, humans have to coordinate aircraft, crews, runways, gates, passenger connections, cancellations, compensation, and airline priorities, all under extreme time pressure.

Existing software can help with pieces of this, but there is no generally deployed end-to-end autonomous system that can recover the full network when all of these constraints interact.

The real-world inspiration is the December 2025-style IndiGo crew crisis: one operational constraint can cascade into hundreds of cancellations and stranded passengers. That is the kind of failure mode Runway Zero is built to simulate.

## Slide 4 — Solution

Our solution is an OpenEnv environment where LLM agents act as airport recovery controllers.

The agent observes a structured world state: airports, flights, aircraft, crews, passengers, weather, runways, gates, disruptions, and pending decisions.

Then it outputs structured JSON actions: hold a flight, cancel only when necessary, swap aircraft, request maintenance, protect connections, negotiate slots, or allocate compensation.

Every step is scored inside the environment using component rewards: delay, safety, passenger harm, airline economics, fairness, and action validity.

Then we train using TRL and GRPO, and host the environment on Hugging Face Spaces with the OpenEnv reset, step, state, and close flow.

## Slide 5 — Agents

We tested four LLM controllers: Qwen2.5 Coder 7B, Qwen3 14B, Gemma 4 31B, and GPT-OSS 120B.

The point was not just to use bigger models. The point was to show that size alone does not solve recovery.

The most important result is that the RL-trained Qwen2.5 Coder 7B beats the base GPT-OSS 120B controller. That is the core story: environment training changes behavior in a way scale alone does not.

## Slide 6 — Results

Across all four crisis levels and all four models, RL training moved the average recovery score from 26.1 to 86.2.

Total simulated delay dropped from 176 thousand minutes to 16 thousand minutes.

Cancellations dropped from 1,827 flights to 393.

And the hardest level, the IndiGo Crisis Replay, improved by more than 500 percent from base LLM behavior to RL-trained behavior.

The important part is that these are not static worksheet scores. The models are scored by acting inside the airport environment and receiving reward from what actually happens next.

## Slide 7 — Live Demo

Now the live demo shows this visually.

On the left, we see the Indian airport recovery board, with real major airport geography and active simulated flights.

On the right, we can toggle Base LLM versus RL-trained LLM, switch between models, change replay speed, and move across four crisis levels.

Level 1 is operations recovery. Level 2 adds passenger harm. Level 3 adds multi-airline competition. Level 4 replays the IndiGo-style crew crisis.

In the Base LLM mode, the controller reacts late and lets cancellations cascade. In RL-trained mode, the controller makes grounded recovery decisions: it protects legal crews, sequences runways, reduces passenger harm, and cancels only flights with no recovery path.

## Closing

Runway Zero is our answer to the hackathon theme: build an environment where an LLM can actually learn to act better.

It is OpenEnv-based, trained with TRL and GRPO, hosted on Hugging Face Spaces, and backed by live visual replay, reward plots, and model comparisons.

Runway Zero asks one question: when the plan breaks, can the model recover the system?

Our results show that with the right environment and reward design, it can.

