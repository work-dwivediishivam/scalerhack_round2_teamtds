#!/usr/bin/env bash
set -euo pipefail

MODEL="$1"
SLUG="$2"
STEPS="${3:-12}"
ARTIFACT_REPO="${ARTIFACT_REPO:-work-dwivediishivam/runway-zero-training-artifacts}"
WORK="/tmp/runway_zero_job_${SLUG}"

rm -rf "$WORK"
git clone --depth 1 https://github.com/work-dwivediishivam/scalerhack_round2_teamtds.git "$WORK"
cd "$WORK"

python -m pip install --upgrade pip
pip install -e .
pip install -r requirements-training.txt

if [[ "${RUNWAY_ZERO_INSTALL_TRANSFORMERS_MAIN:-0}" == "1" ]]; then
  pip install --upgrade "transformers @ git+https://github.com/huggingface/transformers.git"
fi

export TOKENIZERS_PARALLELISM=false

OUT="results/llm_runs/${SLUG}_hf_grpo"
python scripts/train_llm_grpo_all_stages.py \
  --model "$MODEL" \
  --stages 1 2 3 \
  --seed-start 201 \
  --seed-count 4 \
  --warmup-horizon 18 \
  --max-steps "$STEPS" \
  --batch-size 1 \
  --grad-accum 4 \
  --num-generations 2 \
  --max-prompt-length 3072 \
  --max-completion-length 512 \
  --learning-rate 5e-6 \
  --output-dir "$OUT"

tar -czf "/tmp/${SLUG}.tgz" "$OUT"

python - <<PY
import json
import os
from pathlib import Path

from huggingface_hub import HfApi

api = HfApi(token=os.environ["HF_TOKEN"])
repo = "$ARTIFACT_REPO"
slug = "$SLUG"
model = "$MODEL"
steps = int("$STEPS")
api.create_repo(repo_id=repo, repo_type="model", exist_ok=True)
api.upload_file(
    repo_id=repo,
    repo_type="model",
    path_or_fileobj=f"/tmp/{slug}.tgz",
    path_in_repo=f"{slug}/{slug}.tgz",
)
summary = {
    "artifact_url": f"https://huggingface.co/{repo}/blob/main/{slug}/{slug}.tgz",
    "artifact_repo": repo,
    "model": model,
    "hardware": os.environ.get("HF_JOB_FLAVOR", "Hugging Face Jobs GPU"),
    "training_method": "TRL GRPO with LoRA",
    "stages": [1, 2, 3],
    "max_steps": steps,
    "num_generations": 2,
    "status": "completed",
    "notes": "Environment-driven Runway Zero GRPO run across all three stages. Artifact bundle contains the final adapter, trainer state, run summary, and training examples.",
}
Path(f"/tmp/{slug}_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
api.upload_file(
    repo_id=repo,
    repo_type="model",
    path_or_fileobj=f"/tmp/{slug}_summary.json",
    path_in_repo=f"{slug}/{slug}_summary.json",
)
print(json.dumps(summary, indent=2))
PY
