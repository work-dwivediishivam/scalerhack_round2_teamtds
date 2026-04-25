# Pitch

## One-Liner

Most agent benchmarks ask whether an LLM can make a plan. Runway Zero asks
whether it can recover after the plan breaks.

## Story

At 8:00 AM, the Indian airport network looks stable. Flights are scheduled,
crews are assigned, aircraft are ready, and passengers are moving.

Then fog hits Delhi.

Mumbai closes a runway.

Bengaluru loses a gate.

An IndiGo aircraft reports a technical fault.

Crew duty limits start expiring.

Passengers begin missing connections.

IndiGo, Air India, Akasa Air, and SpiceJet begin pushing for their own slots,
cash protection, and reputation recovery while Tower Central must stay neutral.

The agent is no longer solving a static schedule. It is managing a living system
where every fix creates a new consequence.

## What We Built

Runway Zero is an OpenEnv-style airport operations environment. The agent sees a
structured airport state and chooses operational actions: depart, hold, cancel,
swap aircraft, request maintenance, reroute, compensate passengers, negotiate
slots, and protect connections. Rewards are based on delay, safety, passenger
satisfaction, economics, and fairness.

## Why It Matters

Real-world agents will not operate in clean prompt-response worlds. They will
operate inside systems that change while they are acting: APIs fail, people
change priorities, resources disappear, and earlier decisions compound.

Airport operations are a clear, visual, high-pressure domain for training this
capability.

## Demo Arc

1. Show the India network running normally.
2. Trigger cascading disruptions.
3. Replay base-model decisions.
4. Replay RL-trained recovery decisions.
5. Compare reward, delay, stranded passengers, and satisfaction.
6. Show the TRL/GRPO training path.
