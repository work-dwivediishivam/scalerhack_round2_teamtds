# Runway Zero Submission

## Required Links

- Web demo: https://project-2pdc2.vercel.app/
- Training/results page: https://project-2pdc2.vercel.app/training/
- Level 3 replay: https://project-2pdc2.vercel.app/sim/?stage=3
- OpenEnv/HF Space API: https://work-dwivediishivam-runway-zero.hf.space/state
- Hugging Face artifact repo: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts
- Hosted Qwen2.5 GRPO artifact: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/qwen25_coder_7b_hf_grpo/runway_zero_qwen25_coder_7b_hf_grpo.tgz
- Hosted Qwen3 GRPO artifact: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/qwen3_14b_hf_grpo/qwen3_14b_hf_grpo.tgz
- Hosted GPT-OSS GRPO artifact: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/gpt_oss_120b_hf_grpo/gpt_oss_120b_hf_grpo.tgz
- Hosted Gemma GRPO artifact: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/gemma4_31b_it_hf_grpo/gemma4_31b_it_hf_grpo.tgz
- Hugging Face mini-blog/model card: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts/blob/main/README.md

## Minimum Requirements Checklist

- Uses OpenEnv-style reset/step/state/close API: yes.
- OpenEnv manifest included: `openenv.yaml`.
- Environment hosted on Hugging Face Space: yes.
- Training script using TRL/GRPO: `scripts/train_llm_grpo_all_stages.py`.
- Colab-style notebooks: `notebooks/`.
- Evidence of training: `results/plots/`, `results/trained/`, and four hosted GPU GRPO artifacts.
- Mini-blog/writeup: `docs/MINI_BLOG.md`, also uploaded as the Hugging Face artifact repo README.
- README links to demo, Space, training evidence, and artifact: yes.

## Main Pitch

Runway Zero is an OpenEnv benchmark for cascading airport recovery. It tests
whether LLM agents can keep a living airport network operational as fog, runway
closures, aircraft faults, passenger connections, crew timeouts, emergencies,
fuel delays, and airline slot conflicts compound over time.

The core line:

> Most agent benchmarks ask whether an LLM can make a plan. Runway Zero asks
> whether it can recover after the plan breaks.

## What Judges Should Try

1. Open the web demo.
2. Choose Level 3.
3. Toggle Base Model vs RL Trained.
4. Watch active disruptions, airport zoom, live agent negotiation, and reward
   bars.
5. Open the Training page and inspect replay scorecards, curves, and the four
   hosted GRPO artifact links.
