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
- request maintenance then hold
- compensate passengers then hold
- negotiate slot then depart
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

The notebooks contain Colab-ready training scaffolds using Hugging Face TRL:

- `notebooks/02_stage1_grpo_operations.ipynb`
- `notebooks/03_stage2_grpo_passenger_satisfaction.ipynb`
- `notebooks/04_stage3_multi_agent_economics.ipynb`
- `notebooks/04_llm_grpo_all_stages.ipynb`
- `notebooks/05_model_comparison.ipynb`
- `notebooks/06_demo_replay_export.ipynb`

Recommended model progression:

| Role | Model |
| --- | --- |
| Fast rollout/debug | `Qwen/Qwen2.5-Coder-7B-Instruct` |
| Strong planner | `Qwen/Qwen3-14B` |
| High-quality demo judge/planner | `google/gemma-4-31B-it` |
| Ambitious final comparison | `openai/gpt-oss-120b` |

Complete all-stage GRPO entrypoint:

```bash
pip install -r requirements-training.txt
python scripts/train_llm_grpo_all_stages.py \
  --model Qwen/Qwen2.5-Coder-7B-Instruct \
  --stages 1 2 3 \
  --max-steps 60 \
  --output-dir results/llm_runs/qwen25_runway_zero
```

With Unsloth on a compatible GPU runtime:

```bash
python scripts/train_llm_grpo_all_stages.py \
  --model Qwen/Qwen2.5-Coder-7B-Instruct \
  --stages 1 2 3 \
  --max-steps 60 \
  --use-unsloth \
  --output-dir results/llm_runs/qwen25_unsloth_runway_zero
```

Hosted model rollout comparison:

```bash
python scripts/run_hf_model_rollouts.py --model qwen-coder --stage 1 --max-steps 8
python scripts/run_hf_model_rollouts.py --model qwen3 --stage 2 --max-steps 8
```

Local verification already completed:

- installed `datasets`, `transformers`, `trl`, `accelerate`, `peft`, and `torch`
- ran `scripts/train_llm_grpo_all_stages.py` with `hf-internal-testing/tiny-random-GPT2`
- executed a real 1-step GRPO update against the Runway Zero reward function
- saved summary evidence to `results/llm_runs/tiny_grpo_smoke_summary.json`

Hosted GPU verification completed:

- Qwen/Qwen2.5-Coder-7B-Instruct
- Hugging Face Jobs `l4x1`
- TRL GRPO with 4-bit LoRA
- stages 1, 2, and 3
- uploaded artifact bundle to `work-dwivediishivam/runway-zero-training-artifacts`
- summary: `results/llm_runs/hf_qwen25_coder_7b_grpo_summary.json`

## Why The Current Repo Includes Local RL And Heuristics

Full LLM RL fine-tuning requires GPU credits and model access. The simulator,
reward function, local RL controller, baselines, plots, and replay traces are
runnable locally now, while the hosted GRPO entrypoint uses the same environment
reward and can be launched on GPU runtimes.

During the onsite compute window, replace replay-backed model rows with exact
Gemma/GPT-OSS/Qwen GRPO results from the same environment.
