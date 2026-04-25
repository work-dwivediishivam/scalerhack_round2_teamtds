from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from runway_zero.simulator import RunwayZeroEnv

app = FastAPI(title="Runway Zero", version="0.1.0")
ENV = RunwayZeroEnv(stage=1, seed=7)


class ResetRequest(BaseModel):
    stage: int = Field(default=1, ge=1, le=3)
    seed: int = 7


class StepRequest(BaseModel):
    actions: List[Dict[str, Any]] = Field(default_factory=list)


@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "name": "Runway Zero",
        "description": "OpenEnv-style airport crisis recovery environment",
        "endpoints": ["/reset", "/step", "/state", "/close"],
    }


@app.post("/reset")
def reset(request: Optional[ResetRequest] = None) -> Dict[str, Any]:
    payload = request or ResetRequest()
    observation = ENV.reset(stage=payload.stage, seed=payload.seed)
    return {"observation": observation, "state": ENV.state()}


@app.post("/step")
def step(request: StepRequest) -> Dict[str, Any]:
    result = ENV.step(request.actions)
    return {
        "observation": result.observation,
        "reward": result.reward,
        "done": result.done,
        "info": result.info,
    }


@app.get("/state")
def state() -> Dict[str, Any]:
    return ENV.state()


@app.post("/close")
def close() -> Dict[str, str]:
    return {"status": "closed"}

