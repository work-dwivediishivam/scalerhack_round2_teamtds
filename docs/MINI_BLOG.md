# Runway Zero Mini-Blog

The full final writeup is here:

- [Runway Zero: Training LLM Agents To Recover Airport Chaos](BLOG_POST.md)

Runway Zero is an OpenEnv environment where LLM agents learn to recover Indian
airport operations from cascading disruptions. The environment tests whether a
controller can act under fog, runway loss, aircraft faults, crew timeouts,
passenger connection failures, airline cash pressure, and multi-agent slot
competition.

Final links:

- Web demo: https://project-2pdc2.vercel.app/
- Level 4 crisis replay: https://project-2pdc2.vercel.app/sim/?stage=4
- Training evidence: https://project-2pdc2.vercel.app/training/
- Hugging Face Space: https://huggingface.co/spaces/work-dwivediishivam/runway-zero
- Training notebook: https://huggingface.co/spaces/work-dwivediishivam/runway-zero/blob/main/notebooks/04_llm_grpo_all_stages.ipynb
- Training artifacts: https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts

Headline result:

| Metric | Base LLMs | RL-trained LLMs |
| --- | ---: | ---: |
| Average Recovery Score | 26.1 | 86.2 |
| Total delay minutes | 176,157 | 16,823 |
| Cancelled flights | 1,827 | 393 |
| Average satisfaction | 51.7% | 82.0% |

The core line:

> Most agent benchmarks ask whether an LLM can make a plan. Runway Zero asks
> whether it can recover after the plan breaks.
