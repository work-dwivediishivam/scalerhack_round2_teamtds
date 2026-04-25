import { ArrowRight, Gauge, Plane, RadioTower, ShieldAlert } from "lucide-react";

const levels = [
  {
    stage: 1,
    title: "Level 1",
    subtitle: "Operations Recovery",
    description:
      "Four core airports, two airlines, runway pressure, aircraft faults, and time-critical dispatch decisions.",
    metrics: ["Delay minutes", "Safety violations", "Departures recovered"],
  },
  {
    stage: 2,
    title: "Level 2",
    subtitle: "Passenger-Aware Network",
    description:
      "Eight airports, passenger groups, missed connections, emergencies, gate failures, and customer satisfaction.",
    metrics: ["Satisfaction", "Stranded passengers", "Connection protection"],
  },
  {
    stage: 3,
    title: "Level 3",
    subtitle: "Economic Multi-Agent Control",
    description:
      "Airlines compete for scarce slots while the tower balances money, fairness, throughput, and passenger harm.",
    metrics: ["Airline cash", "Fairness", "Network throughput"],
  },
];

export default function DifficultySelect() {
  return (
    <main className="landing">
      <section className="landingHero">
        <div>
          <p className="eyebrow">Runway Zero</p>
          <h1>Train LLM agents to recover airport chaos.</h1>
          <p>
            Pick a difficulty level, then watch baseline controllers and the RL-trained policy fight
            through cascading Indian airport disruptions on a live replay map.
          </p>
        </div>
        <div className="heroStats">
          <div>
            <Plane size={20} />
            <strong>12</strong>
            <span>policy replays</span>
          </div>
          <div>
            <RadioTower size={20} />
            <strong>3</strong>
            <span>difficulty levels</span>
          </div>
          <div>
            <Gauge size={20} />
            <strong>6</strong>
            <span>reward channels</span>
          </div>
          <div>
            <ShieldAlert size={20} />
            <strong>RL</strong>
            <span>trained controller</span>
          </div>
        </div>
      </section>

      <section className="levelGrid">
        {levels.map((level) => (
          <a href={`/sim/?stage=${level.stage}`} className="levelCard" key={level.stage}>
            <div>
              <span>{level.title}</span>
              <h2>{level.subtitle}</h2>
              <p>{level.description}</p>
            </div>
            <ul>
              {level.metrics.map((metric) => (
                <li key={metric}>{metric}</li>
              ))}
            </ul>
            <strong>
              Open simulator <ArrowRight size={18} />
            </strong>
          </a>
        ))}
      </section>

      <section className="landingBand">
        <div>
          <p className="eyebrow">Demo Story</p>
          <h2>Static planning is not enough.</h2>
        </div>
        <p>
          Fog hits Delhi, Mumbai loses a runway, Bengaluru gates jam, an aircraft breaks,
          crew clocks expire, and airlines push selfish slot requests. The trained agent must
          recover the system while every decision changes the next state.
        </p>
      </section>
    </main>
  );
}
