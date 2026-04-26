import { Activity, ArrowLeft, BarChart3, BrainCircuit, PlaneTakeoff, RadioTower } from "lucide-react";
import baselineMetricsJson from "../../public/training/baseline_metrics.json";
import hfGemmaJson from "../../public/training/hf_gemma4_31b_it_grpo_summary.json";
import hfGptOssJson from "../../public/training/hf_gpt_oss_120b_grpo_summary.json";
import hfQwenJson from "../../public/training/hf_qwen25_coder_7b_grpo_summary.json";
import hfQwen3Json from "../../public/training/hf_qwen3_14b_grpo_summary.json";
import hostedRolloutJson from "../../public/training/hosted_model_rollout_summary.json";
import tinySmokeJson from "../../public/training/tiny_grpo_smoke_summary.json";
import trainingSummaryJson from "../../public/training/training_summary.json";
import traceManifestJson from "../../public/traces/trace_manifest.json";

type BaselineMetric = {
  policy: string;
  stage: number;
  seed: number;
  total_reward: number;
  flights_arrived: number;
  flights_cancelled: number;
  total_dep_delay: number;
  stranded_passengers: number;
  avg_satisfaction: number;
};

type TrainingSummary = {
  stage: number;
  episodes: number;
  first_20_avg: number;
  last_20_avg: number;
};

type TraceRow = {
  policy: string;
  stage: number;
  total_reward: number;
  flights_arrived: number;
  flights_cancelled: number;
  total_dep_delay: number;
  stranded_passengers: number;
  avg_satisfaction: number;
};

type HostedGrpoRun = {
  job_url: string;
  artifact_url: string;
  model: string;
  hardware: string;
  max_steps: number;
  status: string;
};

const policyLabels: Record<string, string> = {
  random: "Random",
  fifo: "FIFO",
  recovery_heuristic: "Ops Heuristic",
  trained_rl: "RL Trained",
};

const baselineMetrics = baselineMetricsJson as BaselineMetric[];
const trainingSummary = trainingSummaryJson as TrainingSummary[];
const traceManifest = traceManifestJson as TraceRow[];
const hostedRollout = hostedRolloutJson as {
  model: string;
  total_reward: number;
  steps: number;
  metrics: { avg_satisfaction: number; flights_active: number };
};
const hostedGrpoRuns = [
  hfQwenJson as HostedGrpoRun,
  hfQwen3Json as HostedGrpoRun,
  hfGptOssJson as HostedGrpoRun,
  hfGemmaJson as HostedGrpoRun,
];
const tinySmoke = tinySmokeJson as {
  run_summary: { model: string; max_steps: number; examples: number };
  trainer_state: { global_step: number; log_history: Array<Record<string, number>> };
};

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function policyAverages(stage: number) {
  const rows = baselineMetrics.filter((row) => row.stage === stage);
  const policies = Array.from(new Set(rows.map((row) => row.policy)));
  return policies
    .map((policy) => {
      const policyRows = rows.filter((row) => row.policy === policy);
      return {
        policy,
        reward: mean(policyRows.map((row) => row.total_reward)),
        arrived: mean(policyRows.map((row) => row.flights_arrived)),
        cancelled: mean(policyRows.map((row) => row.flights_cancelled)),
        delay: mean(policyRows.map((row) => row.total_dep_delay)),
        stranded: mean(policyRows.map((row) => row.stranded_passengers)),
      };
    })
    .sort((a, b) => b.reward - a.reward);
}

export default function TrainingPage() {
  const grpoLog = tinySmoke.trainer_state.log_history.at(-1);
  const totalHostedSteps = hostedGrpoRuns.reduce((sum, run) => sum + run.max_steps, 0);
  const replayBest = [1, 2, 3].map((stage) => {
    const rows = traceManifest.filter((row) => row.stage === stage);
    return rows.sort((a, b) => b.total_reward - a.total_reward)[0];
  });

  return (
    <main className="trainingPage">
      <header className="trainingHero">
        <a className="backLink trainingBack" href="/">
          <ArrowLeft size={18} />
          Runway Zero
        </a>
        <div>
          <p className="eyebrow">Training Evidence</p>
          <h1>Controllers are scored inside the airport environment, not on a static worksheet.</h1>
          <p>
            The demo ships deterministic baselines, a trained tabular RL controller, a TRL/GRPO
            smoke run against the real environment reward, and hosted GPU GRPO runs for large model
            agents across all three Runway Zero stages.
          </p>
        </div>
      </header>

      <section className="trainingStats">
        <Stat icon={<RadioTower size={20} />} label="difficulty levels" value="3" />
        <Stat icon={<Activity size={20} />} label="policy replays" value="12" />
        <Stat icon={<BrainCircuit size={20} />} label="HF GRPO runs" value={hostedGrpoRuns.length} />
        <Stat icon={<BarChart3 size={20} />} label="hosted GRPO steps" value={totalHostedSteps} />
        <Stat icon={<PlaneTakeoff size={20} />} label="hosted Qwen rollout reward" value={hostedRollout.total_reward} />
      </section>

      <section className="resultsGrid">
        {[1, 2, 3].map((stage) => (
          <article className="resultPanel" key={stage}>
            <div className="panelHeader">
              <p className="eyebrow">Level {stage}</p>
              <h2>Policy scorecard</h2>
            </div>
            <div className="scoreRows">
              {policyAverages(stage).map((row) => (
                <div className={row.policy === "trained_rl" ? "scoreRow trained" : "scoreRow"} key={row.policy}>
                  <span>{policyLabels[row.policy]}</span>
                  <strong>{row.reward.toFixed(0)}</strong>
                  <em>{row.arrived.toFixed(0)} arrived</em>
                  <em>{row.delay.toFixed(0)} delay min</em>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="plotGrid">
        {trainingSummary.map((row) => (
          <article className="plotPanel" key={row.stage}>
            <div>
              <p className="eyebrow">Level {row.stage}</p>
              <h2>{row.episodes} RL episodes</h2>
              <p>
                First-20 average {row.first_20_avg.toFixed(0)}. Last-20 average{" "}
                {row.last_20_avg.toFixed(0)}.
              </p>
            </div>
            <img src={`/plots/rl_learning_stage${row.stage}.png`} alt={`Level ${row.stage} RL learning curve`} />
          </article>
        ))}
      </section>

      <section className="wideEvidence">
        <article>
          <div className="panelHeader">
            <BarChart3 size={18} />
            <h2>Replay winners</h2>
          </div>
          {replayBest.map((row) => (
            <div className="evidenceRow" key={row.stage}>
              <span>Level {row.stage}</span>
              <strong>{policyLabels[row.policy]}</strong>
              <em>{row.total_reward.toFixed(0)} reward</em>
            </div>
          ))}
        </article>
        <article>
          <div className="panelHeader">
            <BrainCircuit size={18} />
            <h2>LLM RL path</h2>
          </div>
          <div className="evidenceRow">
            <span>TRL/GRPO</span>
            <strong>{tinySmoke.run_summary.model}</strong>
            <em>{grpoLog ? `${grpoLog.num_tokens ?? 0} tokens` : "smoke run complete"}</em>
          </div>
          <div className="evidenceRow">
            <span>Hosted rollout</span>
            <strong>{hostedRollout.model}</strong>
            <em>
              {hostedRollout.steps} steps, {hostedRollout.metrics.avg_satisfaction}% satisfaction
            </em>
          </div>
          {hostedGrpoRuns.map((run) => (
            <div className="evidenceRow" key={run.model}>
              <span>GPU GRPO</span>
              <strong>{run.model}</strong>
              <em>
                {run.status}, {run.hardware}
              </em>
            </div>
          ))}
        </article>
      </section>

      <section className="grpoRunGrid">
        {hostedGrpoRuns.map((run) => (
          <article className="grpoRunCard" key={run.model}>
            <p className="eyebrow">Hosted TRL/GRPO</p>
            <h2>{run.model}</h2>
            <div className="evidenceRow compact">
              <span>Status</span>
              <strong>{run.status}</strong>
              <em>{run.hardware}</em>
            </div>
            <div className="evidenceRow compact">
              <span>Stages</span>
              <strong>1 / 2 / 3</strong>
              <em>{run.max_steps} update steps</em>
            </div>
            <div className="runLinks">
              <a href={run.job_url}>Job log</a>
              <a href={run.artifact_url}>Adapter artifact</a>
            </div>
          </article>
        ))}
      </section>

      <section className="trainingCta">
        <a href="/sim/?stage=3">Open Level 3 replay</a>
        <a href="https://work-dwivediishivam-runway-zero.hf.space/state">Open Space API</a>
        <a href="https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts">Open GRPO artifacts</a>
      </section>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="trainingStat">
      {icon}
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
