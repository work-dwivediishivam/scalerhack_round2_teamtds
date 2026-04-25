# Reward Design

Runway Zero uses decomposed rewards so judges can see what the agent is learning.
The total reward is the sum of operational, passenger, safety, economic,
fairness, and action-validity components.

## Components

| Component | Purpose |
| --- | --- |
| `delay_score` | Rewards timely departures/arrivals and penalizes accumulated delay |
| `safety_score` | Heavily penalizes unsafe departures, runway conflicts, broken aircraft, and invalid crew use |
| `passenger_score` | Rewards protected connections and satisfaction, penalizes stranded passengers |
| `money_score` | Penalizes delay cost, compensation, swaps, and wasted operations |
| `fairness_score` | Penalizes unfair concentration of delays across airlines in Stage 3 |
| `action_validity_score` | Rewards valid structured actions and penalizes invalid action schemas |

## Why Not Only Minimize Delay?

Only minimizing delay creates bad incentives. A model could cancel too many
flights, overload one airline, ignore passenger connections, or make unsafe
departures. The reward therefore treats airport operations as a multi-objective
system:

- safe first
- then throughput
- then passenger outcomes
- then money
- then fairness

## Anti-Hacking Measures

- The environment rejects invalid flight IDs and unknown actions.
- Broken aircraft cannot safely depart.
- Crews cannot fly after duty expiry.
- Canceling flights creates passenger and financial penalties.
- Passenger satisfaction changes over time, not only at episode end.
- Stage 3 penalizes unfair delay distribution.

## Reporting

Every step returns:

```json
{
  "reward_breakdown": {
    "delay_score": 12.4,
    "safety_score": 0.0,
    "passenger_score": 1.8,
    "money_score": -3.2,
    "fairness_score": 0.0,
    "action_validity_score": 2.0,
    "total": 13.0
  }
}
```

This same breakdown is shown in the web dashboard.

