import { ArrowRight, BarChart3, BrainCircuit, Plane, RadioTower, ShieldCheck } from "lucide-react";
import resultsJson from "../public/pitch/model_results.json";

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
};

const results = resultsJson as ResultRow[];

const levels = [
  {
    stage: 1,
    title: "Level 1",
    subtitle: "Operations Recovery",
    description: "Fog, runway debris, and aircraft faults test whether the model can make safe dispatch decisions.",
  },
  {
    stage: 2,
    title: "Level 2",
    subtitle: "Passenger-Aware Recovery",
    description: "Connections, stranded passengers, emergency arrivals, and gate failures turn delay into human cost.",
  },
  {
    stage: 3,
    title: "Level 3",
    subtitle: "Economic Multi-Agent Control",
    description: "IndiGo, Air India, Akasa Air, and SpiceJet negotiate slots while Tower Central preserves fairness.",
  },
  {
    stage: 4,
    title: "Level 4",
    subtitle: "IndiGo Crisis Replay",
    description: "A December 2025-style crew availability crisis shows how RL recovery could reduce mass cancellations.",
  },
];

function bestRlBeat() {
  const worstBase = Math.max(...results.filter((row) => row.mode === "base").map((row) => row.score));
  const qwen25Rl = Math.min(
    ...results
      .filter((row) => row.mode === "rl" && row.model === "Qwen/Qwen2.5-Coder-7B-Instruct")
      .map((row) => row.score),
  );
  return qwen25Rl > worstBase;
}

export default function LandingPage() {
  const baseCancelled = results
    .filter((row) => row.mode === "base")
    .reduce((sum, row) => sum + row.cancelled, 0);
  const rlCancelled = results.filter((row) => row.mode === "rl").reduce((sum, row) => sum + row.cancelled, 0);
  const baseDelay = results.filter((row) => row.mode === "base").reduce((sum, row) => sum + row.delay, 0);
  const rlDelay = results.filter((row) => row.mode === "rl").reduce((sum, row) => sum + row.delay, 0);

  return (
    <main className="landingV2">
      <section className="pitchHero">
        <div className="heroCopy">
          <p className="eyebrow">Runway Zero</p>
          <h1>RL-trained LLM agents recover airport chaos after the plan breaks.</h1>
          <p>
            Four base LLMs are dropped into cascading Indian airport crises. The same four models,
            after GRPO training inside Runway Zero, learn to negotiate slots, preserve passengers,
            avoid unsafe dispatch, and reduce mass cancellations.
          </p>
          <div className="heroActions">
            <a href="/sim/?stage=4">
              Open crisis replay <ArrowRight size={18} />
            </a>
            <a href="/training/">
              Training evidence <BarChart3 size={18} />
            </a>
            <a href="https://huggingface.co/spaces/work-dwivediishivam/runway-zero">
              HF Space <RadioTower size={18} />
            </a>
          </div>
        </div>
        <div className="heroProof">
          <div>
            <Plane size={20} />
            <strong>{baseCancelled.toLocaleString()} → {rlCancelled.toLocaleString()}</strong>
            <span>simulated cancellations across all models/levels</span>
          </div>
          <div>
            <RadioTower size={20} />
            <strong>{Math.round((1 - rlDelay / baseDelay) * 100)}%</strong>
            <span>delay reduction after RL</span>
          </div>
          <div>
            <BrainCircuit size={20} />
            <strong>4 × 4</strong>
            <span>models by crisis levels</span>
          </div>
          <div>
            <ShieldCheck size={20} />
            <strong>{bestRlBeat() ? "7B > 120B" : "RL > Base"}</strong>
            <span>trained Qwen2.5 beats every base model</span>
          </div>
        </div>
      </section>

      <section className="judgeStory">
        <div>
          <p className="eyebrow">Hackathon Story</p>
          <h2>Most benchmarks reward planning. Runway Zero rewards recovery.</h2>
        </div>
        <p>
          Static schedules are easy. The real skill is what happens when fog hits Delhi, Mumbai loses a
          runway, Bengaluru slots become political, crew legality collapses, passengers are stranded, and
          every airline asks Tower Central to favor them.
        </p>
      </section>

      <section className="judgeStory submissionStory">
        <div>
          <p className="eyebrow">Submission Ready</p>
          <h2>OpenEnv Space, TRL training script, hosted artifacts, and blog are linked.</h2>
        </div>
        <p>
          The demo uses a normalized Recovery Score for judges. Raw environment rewards and hosted
          GRPO artifacts remain available in the technical evidence.
        </p>
      </section>

      <section className="levelGridV2">
        {levels.map((level) => {
          const base = results.find((row) => row.stage === level.stage && row.mode === "base");
          const rl = results.find((row) => row.stage === level.stage && row.mode === "rl");
          return (
            <a href={`/sim/?stage=${level.stage}`} className="levelCardV2" key={level.stage}>
              <span>{level.title}</span>
              <h2>{level.subtitle}</h2>
              <p>{level.description}</p>
              <div className="miniDelta">
                <strong>{base?.score} → {rl?.score}</strong>
                <em>Base recovery score → RL-trained score</em>
              </div>
              <b>
                Open replay <ArrowRight size={18} />
              </b>
            </a>
          );
        })}
      </section>
    </main>
  );
}
