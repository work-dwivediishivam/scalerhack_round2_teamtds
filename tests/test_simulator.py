from runway_zero.baselines import FifoPolicy, RecoveryPolicy, rollout
from runway_zero.simulator import RunwayZeroEnv


def test_reset_observation_has_pending_decisions_later():
    env = RunwayZeroEnv(stage=1, seed=7)
    assert env.observation()["stage"] == 1
    for _ in range(4):
        env.step([])
    assert "pending_decisions" in env.observation()


def test_fifo_rollout_finishes():
    result = rollout(FifoPolicy(), stage=1, seed=7)
    assert result["metrics"]["flights_total"] > 0
    assert result["metrics"]["flights_arrived"] + result["metrics"]["flights_cancelled"] > 0


def test_recovery_policy_beats_fifo_on_stage_two_reward():
    fifo = rollout(FifoPolicy(), stage=2, seed=7)
    recovery = rollout(RecoveryPolicy(), stage=2, seed=7)
    assert recovery["total_reward"] >= fifo["total_reward"]

