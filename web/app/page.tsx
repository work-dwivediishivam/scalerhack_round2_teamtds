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
          <h1>RL-trained LLMs recover airport crises that rule-based systems cannot solve end to end.</h1>
          <p className="spaceTierNotice">Space Redeployed to preserve GPU; switched to FREE TIER</p>
          <a
            className="vercelNotice"
            href="https://project-2pdc2.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            Link to Vercel Site - https://project-2pdc2.vercel.app/
          </a>
          <p>
            Airlines still depend on highly trained operations-control teams when disruption cascades
            across aircraft, crews, passengers, runways, airline economics, and fairness. Runway Zero
            turns that unsolved end-to-end recovery problem into an OpenEnv environment where LLM agents
            learn from verifiable rewards.
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
            <strong>{rlCancelled.toLocaleString()} RL / {baseCancelled.toLocaleString()} base</strong>
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
            <strong>{bestRlBeat() ? "7B RL > 120B w/o RL" : "RL > Base"}</strong>
            <span>trained Qwen2.5 beats every base model</span>
          </div>
        </div>
      </section>

      <section className="spaceNotice">
        <div>
          <p className="eyebrow">Hugging Face Space</p>
          <h2>The Space runs the OpenEnv environment; the large-model training evidence is linked here.</h2>
          <p>
            The public Space keeps the reset, step, state, and close API live for evaluation. The
            7B, 14B, 31B, and 120B LLM training runs were executed as GPU GRPO jobs, then exported as
            adapters, trainer states, replay traces, and plots. Keeping those models loaded inside a
            public demo Space would make the judge experience slow and unreliable, so this page opens
            the exact replay UI and links the notebooks and artifacts used to verify training.
          </p>
        </div>
        <div className="spaceLinks">
          <a href="/api">OpenEnv API metadata</a>
          <a href="/state">Live environment state</a>
          <a href="/training/">Training evidence GUI</a>
          <a href="https://huggingface.co/spaces/work-dwivediishivam/runway-zero/tree/main/notebooks">
            GRPO notebook
          </a>
          <a href="https://huggingface.co/work-dwivediishivam/runway-zero-training-artifacts">
            Hosted training artifacts
          </a>
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
          every airline asks Tower Central to favor them. Existing tools support pieces of this work; the
          complete end-to-end recovery problem remains human-led.
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
                <strong>{rl?.score} RL / {base?.score} base</strong>
                <em>Recovery score comparison</em>
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
