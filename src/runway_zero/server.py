from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from runway_zero.simulator import RunwayZeroEnv

app = FastAPI(title="Runway Zero", version="0.1.0")
ENV = RunwayZeroEnv(stage=1, seed=7)
WEB_OUT = Path(__file__).resolve().parents[2] / "web" / "out"


class ResetRequest(BaseModel):
    stage: int = Field(default=1, ge=1, le=4)
    seed: int = 7


class StepRequest(BaseModel):
    actions: List[Dict[str, Any]] = Field(default_factory=list)


def environment_metadata() -> Dict[str, Any]:
    return {
        "name": "Runway Zero",
        "description": "OpenEnv airport crisis recovery environment",
        "endpoints": {
            "reset": "/reset",
            "step": "/step",
            "state": "/state",
            "close": "/close",
            "metadata": "/api",
        },
        "demo": {
            "homepage": "/",
            "stage_1": "/sim/?stage=1",
            "stage_2": "/sim/?stage=2",
            "stage_3": "/sim/?stage=3",
            "stage_4": "/sim/?stage=4",
            "training": "/training/",
        },
    }


@app.get("/")
def root() -> Any:
    index = WEB_OUT / "index.html"
    if index.exists():
        return FileResponse(index)
    return JSONResponse(environment_metadata())


@app.get("/api")
def api_metadata() -> Dict[str, Any]:
    return environment_metadata()


@app.get("/healthz")
def healthz() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/reset")
def reset(request: Optional[ResetRequest] = None) -> Dict[str, Any]:
    payload = request or ResetRequest()
    observation = ENV.reset(stage=payload.stage, seed=payload.seed)
    return {"observation": observation, "state": ENV.state}


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
    return ENV.state


@app.post("/close")
def close() -> Dict[str, str]:
    return {"status": "closed"}


if WEB_OUT.exists():
    app.mount("/_next", StaticFiles(directory=WEB_OUT / "_next"), name="next-static")
    app.mount("/pitch", StaticFiles(directory=WEB_OUT / "pitch", html=True), name="pitch")
    app.mount("/sim", StaticFiles(directory=WEB_OUT / "sim", html=True), name="sim")
    app.mount("/training", StaticFiles(directory=WEB_OUT / "training", html=True), name="training")
