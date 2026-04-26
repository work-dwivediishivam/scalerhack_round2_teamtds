import { ArrowLeft, BarChart3, BrainCircuit, PlaneTakeoff, RadioTower, TrendingUp } from "lucide-react";
import hfGemmaJson from "../../public/training/hf_gemma4_31b_it_grpo_summary.json";
import hfGptOssJson from "../../public/training/hf_gpt_oss_120b_grpo_summary.json";
import hfQwenJson from "../../public/training/hf_qwen25_coder_7b_grpo_summary.json";
import hfQwen3Json from "../../public/training/hf_qwen3_14b_grpo_summary.json";
import resultsJson from "../../public/pitch/model_results.json";

type ResultRow = {
  stage: number;
  stage_label: string;
  stage_title: string;
  model: string;
  label: string;
  short: string;
  mode: "base" | "rl";
  score: number;
  reward: number;
  raw_reward: number;
  delay: number;
  cancelled: number;
  satisfaction: number;
  stranded: number;
};

type HostedGrpoRun = {
  job_url: string;
  artifact_url: string;
  model: string;
  hardware: string;
  max_steps: number;
  status: string;
  training_method: string;
};

const results = resultsJson as ResultRow[];
const hostedGrpoRuns = [
  hfQwenJson as HostedGrpoRun,
  hfQwen3Json as HostedGrpoRun,
  hfGptOssJson as HostedGrpoRun,
  hfGemmaJson as HostedGrpoRun,
];

const models = Array.from(new Map(results.map((row) => [row.model, row])).values());
const stages = [1, 2, 3, 4];

function pair(stage: number, model: string) {
  return {
    base: results.find((row) => row.stage === stage && row.model === model && row.mode === "base"),
    rl: results.find((row) => row.stage === stage && row.model === model && row.mode === "rl"),
  };
}

export default function TrainingPage() {
  const totalSteps = hostedGrpoRuns.reduce((sum, run) => sum + run.max_steps, 0);
  const baseDelay = results.filter((row) => row.mode === "base").reduce((sum, row) => sum + row.delay, 0);
  const rlDelay = results.filter((row) => row.mode === "rl").reduce((sum, row) => sum + row.delay, 0);
  const baseCancels = results.filter((row) => row.mode === "base").reduce((sum, row) => sum + row.cancelled, 0);
  const rlCancels = results.filter((row) => row.mode === "rl").reduce((sum, row) => sum + row.cancelled, 0);

  return (
    <main className="trainingV2">
      <header className="trainingHeroV2">
        <a className="backLink trainingBack" href="/">
          <ArrowLeft size={18} />
          Runway Zero
        </a>
        <div>
          <p className="eyebrow">Training Evidence</p>
          <h1>Same four LLMs. Same airport crises. Better behavior after RL.</h1>
          <p>
            Every chart compares a base LLM against its RL-trained version inside the same Runway
            Zero environment. The point is simple: targeted environment training beats raw model
            size on a recovery task that still requires highly trained human operations teams in
            the real world.
          </p>
        </div>
      </header>

      <section className="trainingStats">
        <Stat icon={<BrainCircuit size={20} />} label="hosted GRPO runs" value={hostedGrpoRuns.length} />
        <Stat icon={<RadioTower size={20} />} label="crisis levels" value="4" />
        <Stat icon={<TrendingUp size={20} />} label="delay reduction" value={`${Math.round((1 - rlDelay / baseDelay) * 100)}%`} />
        <Stat icon={<PlaneTakeoff size={20} />} label="RL/base cancellations" value={`${rlCancels}/${baseCancels}`} />
        <Stat icon={<BarChart3 size={20} />} label="GRPO update steps" value={totalSteps} />
      </section>

      <section className="submissionPanel">
        <div>
          <p className="eyebrow">Judge-Facing Evidence</p>
          <h2>Submission Evidence</h2>
          <p>
            The same OpenEnv environment powers the Hugging Face Space, training notebooks,
            hosted GRPO artifacts, recovery-score plots, and visual crisis dashboard.
          </p>
        </div>
        <div className="submissionLinks">
          <a href="https://work-dwivediishivam-runway-zero.hf.space/state">HF Space Environment</a>
          <a href="https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts">Training Artifacts</a>
          <a href="https://huggingface.co/spaces/work-dwivediishivam/runway-zero/blob/main/docs/BLOG_POST.md">
            Blog Post
          </a>
        </div>
      </section>

      <section className="evidenceMatrix">
        {stages.map((stage) => (
          <article key={stage} className="matrixPanel">
            <p className="eyebrow">Level {stage}</p>
            <h2>{results.find((row) => row.stage === stage)?.stage_title}</h2>
            {models.map((model) => {
              const { base, rl } = pair(stage, model.model);
              return (
                <div className="matrixRow" key={`${stage}-${model.model}`}>
                  <span>{model.label}</span>
                  <strong>
                    {rl?.score} RL / {base?.score} base
                  </strong>
                  <em>
                    delay {rl?.delay.toLocaleString()} RL / {base?.delay.toLocaleString()} base
                  </em>
                </div>
              );
            })}
          </article>
        ))}
      </section>

      <section className="plotGridV2">
        {stages.map((stage) => (
          <article className="plotPanel" key={stage}>
            <h2>Level {stage}: recovery score improvement</h2>
            <img src={`/pitch/plots/stage${stage}_reward_comparison.png`} alt={`Level ${stage} reward comparison`} />
          </article>
        ))}
      </section>

      <section className="plotGridV2">
        {models.map((model) => (
          <article className="plotPanel" key={model.model}>
            <h2>{model.label}: GRPO curve</h2>
            <img
              src={`/pitch/plots/${model.short.toLowerCase().replaceAll("-", "").replaceAll(".", "")}_training_curve.png`}
              alt={`${model.label} training curve`}
            />
          </article>
        ))}
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
