# YouTube Description

Blog / full submission writeup: https://huggingface.co/spaces/work-dwivediishivam/runway-zero/blob/main/docs/BLOG_POST.md
Live web demo: https://project-2pdc2.vercel.app/
Level 4 crisis replay: https://project-2pdc2.vercel.app/sim/?stage=4
Training evidence dashboard: https://project-2pdc2.vercel.app/training/
Hugging Face Space environment: https://huggingface.co/spaces/work-dwivediishivam/runway-zero
Live Space API: https://work-dwivediishivam-runway-zero.hf.space/state
Training notebook: https://huggingface.co/spaces/work-dwivediishivam/runway-zero/blob/main/notebooks/04_llm_grpo_all_stages.ipynb
Training artifacts: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts
GitHub repository: https://github.com/work-dwivediishivam/scalerhack_round2_teamtds

Runway Zero is an OpenEnv environment where LLM agents learn to recover Indian airport operations from cascading disruptions.

The problem: airline disruption recovery still depends on highly trained operations-control teams coordinating aircraft, crews, passengers, runways, gates, maintenance, cancellations, compensation, airline economics, and fairness. Existing software helps with parts of the workflow, but there is no generally deployed autonomous system that recovers the full cascading network end to end.

Runway Zero turns that problem into a trainable environment. The agent observes the airport network, outputs structured recovery actions, acts through the OpenEnv reset/step/state loop, and receives component rewards for delay, safety, passenger harm, airline economics, fairness, and action validity.

The demo includes four crisis levels:
L1 Operations Recovery
L2 Passenger-Aware Network
L3 Economic Multi-Agent Control
L4 IndiGo-style Crisis Replay

Models compared:
Qwen2.5 Coder 7B
Qwen3 14B
Gemma 4 31B IT
GPT-OSS 120B

Headline results across all four models and all four levels:
Average Recovery Score: 26.1 base -> 86.2 RL-trained
Total delay minutes: 176,157 base -> 16,823 RL-trained
Cancelled flights: 1,827 base -> 393 RL-trained
Passenger satisfaction: 51.7% base -> 82.0% RL-trained

Key story: the trained Qwen2.5 Coder 7B controller beats every base model, including the GPT-OSS 120B base controller. Size alone does not solve cascading recovery. Environment training changes behavior.

Most benchmarks ask whether an LLM can make a plan. Runway Zero asks whether it can recover after the plan breaks.

Companion video overlay:
OpenMonopoly India is a separate small RL environment used only as a visual overlay in the video intro.
OpenMonopoly live demo: https://frontend-one-beta-84.vercel.app
OpenMonopoly HF Space: https://huggingface.co/spaces/work-dwivediishivam/openmonopoly-india
OpenMonopoly GitHub: https://github.com/work-dwivediishivam/scalerhack_round2_monopoly_teamtds

Submitted for the Meta PyTorch OpenEnv Hackathon x Scaler School of Technology.
