# Training Plan

## Baselines

The repository includes three policies:

- `random`: intentionally poor lower bound
- `fifo`: first-in-first-out operations baseline
- `recovery_heuristic`: human-designed recovery controller used as a warm-start and trained-agent stand-in

Run:

```bash
python scripts/train_rl_controller.py
python scripts/evaluate_baselines.py
python scripts/make_plots.py
python scripts/export_demo_trace.py
```

Outputs:

- `results/baseline_metrics.json`
- `results/plots/total_reward.png`
- `results/plots/total_dep_delay.png`
- `results/plots/stranded_passengers.png`
- `results/plots/avg_satisfaction.png`
- `results/trained/q_policy_stage1.json`
- `results/trained/q_policy_stage2.json`
- `results/trained/q_policy_stage3.json`

## Local RL Controller

`scripts/train_rl_controller.py` trains a warm-started tabular RL controller
against all three stages. It is intentionally lightweight so it can be rerun
without GPU access during demos.

The controller learns over coarse operational state buckets:

- difficulty stage
- delay bucket
- aircraft readiness
- crew readiness
- weather pressure
- emergency priority
- disruption count
- passenger volume

Available action templates:

- depart
- hold 15 minutes
- hold 30 minutes
- protect passengers then depart
- protect passengers then hold
- swap aircraft then depart
- cancel only if late

This is the locally runnable RL proof. It produces saved Q-tables and replay
traces used by the dashboard.

## LLM TRL / GRPO Path

The intended RL loop is:

1. Serialize the current observation into a compact prompt.
2. Let the model emit JSON actions.
3. Execute actions in `RunwayZeroEnv.step`.
4. Use the returned scalar reward and reward components.
5. Optimize with TRL GRPO.

The notebook `notebooks/02_stage1_grpo_operations.ipynb` contains a Colab-ready
minimal training scaffold using Hugging Face TRL. For stages 2 and 3, reuse the
same reward function with `build_prompts(stage=2)` and `build_prompts(stage=3)`.

Recommended model progression:

| Role | Model |
| --- | --- |
| Fast rollout/debug | `Qwen/Qwen2.5-Coder-7B-Instruct` |
| Strong planner | `Qwen/Qwen3-14B` |
| High-quality demo judge/planner | `google/gemma-4-31B-it` |
| Ambitious final comparison | `openai/gpt-oss-120b` |

## Why The Current Repo Includes Heuristic Recovery

Full LLM RL fine-tuning requires GPU credits and model access. The simulator,
reward function, local RL controller, baselines, plots, and replay traces are
runnable locally now.

During the onsite compute window, replace the heuristic policy with model
rollouts and run the GRPO notebook against the same environment.
