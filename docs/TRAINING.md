# Training Plan

## Baselines

The repository includes three policies:

- `random`: intentionally poor lower bound
- `fifo`: first-in-first-out operations baseline
- `recovery_heuristic`: human-designed recovery controller used as a warm-start and trained-agent stand-in

Run:

```bash
python scripts/evaluate_baselines.py
python scripts/make_plots.py
```

Outputs:

- `results/baseline_metrics.json`
- `results/plots/total_reward.png`
- `results/plots/total_dep_delay.png`
- `results/plots/stranded_passengers.png`
- `results/plots/avg_satisfaction.png`

## TRL / GRPO Path

The intended RL loop is:

1. Serialize the current observation into a compact prompt.
2. Let the model emit JSON actions.
3. Execute actions in `RunwayZeroEnv.step`.
4. Use the returned scalar reward and reward components.
5. Optimize with TRL GRPO.

The notebook `notebooks/02_stage1_grpo_operations.ipynb` contains a Colab-ready
minimal training scaffold using Hugging Face TRL. It is designed to be filled
with the hackathon compute environment/model choice.

## Why The Current Repo Includes Heuristic Recovery

Full LLM RL training requires GPU credits and model access. The simulator,
reward function, baselines, plots, and replay traces are runnable locally now.
The heuristic recovery policy gives an immediate reference curve and validates
that the environment rewards better recovery behavior.

During the onsite compute window, replace the heuristic policy with model
rollouts and run the GRPO notebook against the same environment.

