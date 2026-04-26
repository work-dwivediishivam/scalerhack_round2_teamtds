# YouTube Description

Blog post and full submission writeup: https://huggingface.co/spaces/work-dwivediishivam/runway-zero/blob/main/docs/BLOG_POST.md

Runway Zero is an OpenEnv environment where LLM agents learn to recover Indian airport operations from cascading disruptions. Base LLMs can describe an airport crisis. RL-trained LLMs learn to recover it by acting inside the environment and receiving verifiable reward.

Live links:

- Web demo: https://project-2pdc2.vercel.app/
- Level 4 IndiGo crisis replay: https://project-2pdc2.vercel.app/sim/?stage=4
- Training evidence dashboard: https://project-2pdc2.vercel.app/training/
- Hugging Face Space environment: https://huggingface.co/spaces/work-dwivediishivam/runway-zero
- Live Space API: https://work-dwivediishivam-runway-zero.hf.space/state
- Training notebook: https://huggingface.co/spaces/work-dwivediishivam/runway-zero/blob/main/notebooks/04_llm_grpo_all_stages.ipynb
- Training artifacts: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts
- GitHub repository: https://github.com/work-dwivediishivam/scalerhack_round2_teamtds

What this demo shows:

- Four crisis levels: operations, passenger-aware recovery, economic multi-agent control, and an IndiGo-style cancellation crisis replay.
- Four base LLM controllers: Qwen2.5 Coder 7B, Qwen3 14B, Gemma 4 31B IT, and GPT-OSS 120B.
- Four RL-trained versions of the same controllers.
- A live visual dashboard with Indian airports, flight arcs, disruption markers, airport zoom, airline cash pressure, and multi-agent negotiation.
- Training evidence with hosted GRPO artifacts, recovery-score plots, delay plots, and Colab-compatible notebook.

Headline results:

- Average Recovery Score: 26.1 base / 86.2 RL-trained.
- Total delay minutes: 176,157 base / 16,823 RL-trained.
- Cancelled flights: 1,827 base / 393 RL-trained.
- Average passenger satisfaction: 51.7% base / 82.0% RL-trained.

The core idea:

Most agent benchmarks ask whether an LLM can make a plan. Runway Zero asks whether it can recover after the plan breaks.

Companion video overlay:

The small Monopoly-style board playing during the intro is OpenMonopoly India, a separate RL environment used only as a visual overlay in this pitch. Links:

- Live demo: https://frontend-one-beta-84.vercel.app
- Hugging Face Space: https://huggingface.co/spaces/work-dwivediishivam/openmonopoly-india
- GitHub: https://github.com/work-dwivediishivam/scalerhack_round2_monopoly_teamtds
- Colab notebook: https://colab.research.google.com/github/work-dwivediishivam/scalerhack_round2_monopoly_teamtds/blob/main/notebooks/openmonopoly_training_colab.ipynb

Submitted for the Meta PyTorch OpenEnv Hackathon x Scaler School of Technology.
