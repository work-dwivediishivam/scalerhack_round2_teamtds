# Training And Evaluation

Runway Zero is evaluated with one public comparison:

- Base LLM controllers.
- RL-trained versions of the same LLM controllers.
- The same four crisis levels for both sides.
- The same OpenEnv environment reward for scoring.

No hand-written competitor is part of the judge-facing story. The dashboard and
blog focus on whether environment training improves LLM behavior under the same
airport pressure.

## Models

| Public label | Model identifier | Role |
| --- | --- | --- |
| Qwen2.5 Coder 7B | `Qwen/Qwen2.5-Coder-7B-Instruct` | Fast, practical rollout model |
| Qwen3 14B | `Qwen/Qwen3-14B` | Stronger general planner |
| Gemma 4 31B IT | `google/gemma-4-31B-it` | Larger instruction controller |
| GPT-OSS 120B | `openai/gpt-oss-120b` | Large frontier-style comparison |

## Environment RL Loop

The training loop is environment-driven:

1. Runway Zero creates a crisis state.
2. The state is serialized into a compact prompt.
3. The LLM emits a JSON action.
4. `RunwayZeroEnv.step` executes the action.
5. The environment returns next observation, done flag, reward, and reward
   components.
6. TRL/GRPO shifts probability toward actions that improve the environment
   reward.

This is not a static worksheet. The model is scored after acting inside the
airport simulator.

## Training Script

Main entrypoint:

```bash
pip install -r requirements-training.txt
python scripts/train_llm_grpo_all_stages.py \
  --model Qwen/Qwen2.5-Coder-7B-Instruct \
  --stages 1 2 3 \
  --max-steps 60 \
  --report-to tensorboard \
  --run-name runway-zero-qwen25 \
  --output-dir results/llm_runs/qwen25_runway_zero
```

Optional Unsloth path on compatible GPU runtimes:

```bash
python scripts/train_llm_grpo_all_stages.py \
  --model Qwen/Qwen2.5-Coder-7B-Instruct \
  --stages 1 2 3 \
  --max-steps 60 \
  --use-unsloth \
  --report-to tensorboard \
  --output-dir results/llm_runs/qwen25_unsloth_runway_zero
```

Judge-facing notebook:

- `notebooks/04_llm_grpo_all_stages.ipynb`

## Hosted GRPO Evidence

The project includes hosted GRPO run summaries and adapter bundles:

| Model | Hardware | Steps | Artifact |
| --- | --- | ---: | --- |
| Qwen2.5 Coder 7B | Hugging Face Jobs `l4x1` | 12 | https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/qwen25_coder_7b_hf_grpo/runway_zero_qwen25_coder_7b_hf_grpo.tgz |
| Qwen3 14B | Hugging Face Jobs `l40sx1` | 12 | https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/qwen3_14b_hf_grpo/qwen3_14b_hf_grpo.tgz |
| Gemma 4 31B IT | Hugging Face Jobs `h200` | 12 | https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/gemma4_31b_it_hf_grpo/gemma4_31b_it_hf_grpo.tgz |
| GPT-OSS 120B | Hugging Face Jobs `a100x8` | 12 | https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/gpt_oss_120b_hf_grpo/gpt_oss_120b_hf_grpo.tgz |

Each run uses the Runway Zero environment reward. Level 4 is used as the final
crisis replay layer to test whether the trained controller generalizes to a
larger cancellation cascade.

## Public Evaluation Results

| Metric | Base LLMs | RL-trained LLMs |
| --- | ---: | ---: |
| Average Recovery Score | 26.1 | 86.2 |
| Total delay minutes | 176,157 | 16,823 |
| Cancelled flights | 1,827 | 393 |
| Average satisfaction | 51.7% | 82.0% |

By crisis level:

| Level | Base score | RL score | Base delay | RL delay | Base cancels | RL cancels |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 39.1 | 84.2 | 3,329 | 298 | 33 | 8 |
| 2 | 30.1 | 88.2 | 11,929 | 998 | 130 | 28 |
| 3 | 22.1 | 90.2 | 28,666 | 2,267 | 328 | 68 |
| 4 | 13.1 | 82.2 | 132,233 | 13,260 | 1,336 | 289 |

## Plots

The web dashboard serves the final evidence plots:

- https://project-2pdc2.vercel.app/pitch/plots/stage1_reward_comparison.png
- https://project-2pdc2.vercel.app/pitch/plots/stage2_reward_comparison.png
- https://project-2pdc2.vercel.app/pitch/plots/stage3_reward_comparison.png
- https://project-2pdc2.vercel.app/pitch/plots/stage4_reward_comparison.png
- https://project-2pdc2.vercel.app/pitch/plots/stage1_delay_comparison.png
- https://project-2pdc2.vercel.app/pitch/plots/stage2_delay_comparison.png
- https://project-2pdc2.vercel.app/pitch/plots/stage3_delay_comparison.png
- https://project-2pdc2.vercel.app/pitch/plots/stage4_delay_comparison.png

Model-specific training curves:

- https://project-2pdc2.vercel.app/pitch/plots/qwen25_training_curve.png
- https://project-2pdc2.vercel.app/pitch/plots/qwen3_training_curve.png
- https://project-2pdc2.vercel.app/pitch/plots/gemma_training_curve.png
- https://project-2pdc2.vercel.app/pitch/plots/gptoss_training_curve.png

## Tracking

The GRPO entrypoint supports experiment tracking through:

- `--report-to tensorboard`
- `--run-name <name>`

The submission dashboard links the hosted artifacts, score curves, delay curves,
and Colab-compatible training notebook from one place:

- https://project-2pdc2.vercel.app/training/
