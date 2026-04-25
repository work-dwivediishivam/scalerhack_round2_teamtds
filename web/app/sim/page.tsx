"use client";

import {
  Activity,
  AlertTriangle,
  Gauge,
  Plane,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Airport, Frame, Trace, TraceManifestRow } from "../../lib/types";

const airportPositions: Record<string, { x: number; y: number }> = {
  DEL: { x: 45, y: 23 },
  BOM: { x: 30, y: 57 },
  BLR: { x: 43, y: 75 },
  HYD: { x: 48, y: 62 },
  MAA: { x: 56, y: 80 },
  CCU: { x: 74, y: 46 },
  AMD: { x: 30, y: 43 },
  COK: { x: 41, y: 87 },
};

const policyLabels: Record<string, string> = {
  random: "Random",
  fifo: "FIFO Baseline",
  recovery_heuristic: "Ops Heuristic",
  trained_rl: "RL Trained",
};

const stageLabels: Record<number, string> = {
  1: "Level 1: Operations",
  2: "Level 2: Passengers",
  3: "Level 3: Economics",
};

const speeds = [
  { label: "0.5x", ms: 1600 },
  { label: "1x", ms: 900 },
  { label: "2x", ms: 460 },
  { label: "4x", ms: 220 },
];

const modelLineup = [
  "google/gemma-4-31B-it",
  "openai/gpt-oss-120b",
  "Qwen/Qwen2.5-Coder-7B-Instruct",
  "Qwen/Qwen3-14B",
];

export default function Home() {
  const [manifest, setManifest] = useState<TraceManifestRow[]>([]);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [stage, setStage] = useState(2);
  const [policy, setPolicy] = useState("trained_rl");
  const [speedMs, setSpeedMs] = useState(900);
  const [selectedAirport, setSelectedAirport] = useState("DEL");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedStage = Number(params.get("stage"));
    if ([1, 2, 3].includes(requestedStage)) {
      setStage(requestedStage);
    }
  }, []);

  const traceName = `${policy}_stage${stage}_seed7`;

  useEffect(() => {
    fetch("/traces/trace_manifest.json")
      .then((response) => response.json())
      .then((payload: TraceManifestRow[]) => setManifest(payload));
  }, []);

  useEffect(() => {
    fetch(`/traces/${traceName}.json`)
      .then((response) => response.json())
      .then((payload: Trace) => {
        setTrace(payload);
        setFrameIndex(0);
      });
  }, [traceName]);

  useEffect(() => {
    if (!playing || !trace) return;
    const timer = window.setInterval(() => {
      setFrameIndex((value) => (value + 1) % trace.frames.length);
    }, speedMs);
    return () => window.clearInterval(timer);
  }, [playing, trace, speedMs]);

  const frame = trace?.frames[frameIndex];
  const airports = frame?.observation.airports ?? [];
  const selected = airports.find((airport) => airport.code === selectedAirport) ?? airports[0];
  const stageRows = manifest.filter((row) => row.stage === stage);

  const routes = useMemo(() => {
    const pending = frame?.observation.pending_decisions.slice(0, 14) ?? [];
    return pending
      .map((flight) => ({
        id: flight.flight_id,
        origin: airportPositions[flight.origin],
        destination: airportPositions[flight.destination],
        delay: flight.delay_minutes,
      }))
      .filter((route) => route.origin && route.destination);
  }, [frame]);

  if (!trace || !frame) {
    return <main className="loading">Loading Runway Zero replay...</main>;
  }

  return (
    <main className="shell simShell">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            <a className="backLink" href="/">
              Runway Zero
            </a>
          </p>
          <h1>Airport Recovery Environment</h1>
        </div>
        <div className="controlStrip">
          <Segmented
            values={[1, 2, 3]}
            value={stage}
            label={(value) => `L${value}`}
            onChange={(value) => setStage(value)}
          />
          <Segmented
            values={["fifo", "recovery_heuristic", "trained_rl"]}
            value={policy}
            label={(value) => policyLabels[String(value)]}
            onChange={(value) => setPolicy(String(value))}
          />
          <div className="clock">
            <span>{frame.observation.clock}</span>
            <button aria-label="toggle replay" onClick={() => setPlaying((value) => !value)}>
              {playing ? <Activity size={18} /> : <Play size={18} />}
            </button>
            <button aria-label="restart replay" onClick={() => setFrameIndex(0)}>
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </header>

      <section className="heroGrid">
        <div className="mapPanel">
          <iframe
            title="OpenStreetMap India"
            className="actualMap"
            src="https://www.openstreetmap.org/export/embed.html?bbox=66.0%2C5.0%2C92.5%2C35.8&layer=mapnik"
          />
          <svg className="routes" viewBox="0 0 100 100" preserveAspectRatio="none">
            {routes.map((route, index) => (
              <g key={`${route.id}-${index}`}>
                <path
                  d={`M ${route.origin.x} ${route.origin.y} Q ${
                    (route.origin.x + route.destination.x) / 2
                  } ${Math.min(route.origin.y, route.destination.y) - 12} ${route.destination.x} ${
                    route.destination.y
                  }`}
                  className={route.delay > 45 ? "route delayed" : "route"}
                />
                <circle
                  className="planeDot"
                  cx={(route.origin.x * 0.42 + route.destination.x * 0.58).toFixed(2)}
                  cy={(route.origin.y * 0.42 + route.destination.y * 0.58).toFixed(2)}
                  r="0.95"
                />
              </g>
            ))}
          </svg>
          {airports.map((airport) => (
            <button
              key={airport.code}
              className={`airportNode ${airport.code === selectedAirport ? "selected" : ""} ${
                airport.weather_delay > 0 || airport.runway_closed_until > frame.time ? "warning" : ""
              }`}
              style={{
                left: `${airportPositions[airport.code]?.x ?? 50}%`,
                top: `${airportPositions[airport.code]?.y ?? 50}%`,
              }}
              onClick={() => setSelectedAirport(airport.code)}
            >
              <span>{airport.code}</span>
            </button>
          ))}
        </div>

        <section className="missionPanel">
          <p className="eyebrow">{stageLabels[stage]}</p>
          <h2>{policyLabels[policy]}</h2>
          <div className="score">
            <span>Total reward</span>
            <strong>{trace.total_reward.toFixed(1)}</strong>
          </div>
          <RewardBars frame={frame} />
          <SpeedControl value={speedMs} onChange={setSpeedMs} />
        </section>
      </section>

      <section className="opsGrid">
        <AirportPanel airport={selected} time={frame.time} />
        <section className="feed comms">
          <h2>Agent Communications</h2>
          {frame.agent_messages.slice(0, 8).map((item, index) => (
            <article key={`${frame.time}-message-${index}`}>
              <span>
                {item.from} → {item.to}
              </span>
              <p>{item.message}</p>
            </article>
          ))}
        </section>
        <section className="feed">
          <h2>Active Disruptions</h2>
          {frame.active_disruptions.map((item) => (
            <article key={item.disruption_id}>
              <span>{item.kind.replace("_", " ")}</span>
              <p>{item.message}</p>
            </article>
          ))}
          {!frame.active_disruptions.length && <p className="empty">Network nominal.</p>}
        </section>
      </section>

      <section className="comparison">
        <div className="metricGrid">
          <Metric icon={<Plane size={17} />} label="Arrived" value={frame.metrics.flights_arrived} />
          <Metric
            icon={<AlertTriangle size={17} />}
            label="Cancelled"
            value={frame.metrics.flights_cancelled}
          />
          <Metric
            icon={<Activity size={17} />}
            label="Delay Min"
            value={frame.metrics.total_dep_delay}
          />
          <Metric
            icon={<Users size={17} />}
            label="Satisfaction"
            value={`${frame.metrics.avg_satisfaction}%`}
          />
        </div>
        <ModelComparison rows={stageRows} selected={policy} />
        <section className="modelLineup">
          <div className="scoreTitle">
            <SlidersHorizontal size={18} />
            <span>Model lineup for LLM rollouts</span>
          </div>
          {modelLineup.map((model) => (
            <span key={model}>{model}</span>
          ))}
        </section>
      </section>
    </main>
  );
}

function AirportPanel({ airport, time }: { airport?: Airport; time: number }) {
  if (!airport) return null;
  const runwayIssue = airport.runway_closed_until > time;
  const gateIssue = airport.gate_blocked_until > time;
  const bbox = `${airport.lon - 0.08}%2C${airport.lat - 0.05}%2C${airport.lon + 0.08}%2C${
    airport.lat + 0.05
  }`;
  return (
    <section className="airportPanel">
      <div className="airportMap">
        <iframe
          title={`${airport.code} airport map`}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${airport.lat}%2C${airport.lon}`}
        />
      </div>
      <div className="airportDetails">
        <p className="eyebrow">Airport Zoom</p>
        <h2>
          {airport.city} <span>{airport.code}</span>
        </h2>
        <div className="runwayGrid">
          {Array.from({ length: airport.runways }).map((_, index) => (
            <div key={index} className={`runway ${runwayIssue && index === 0 ? "closed" : ""}`}>
              RWY {index + 1}
            </div>
          ))}
        </div>
        <div className="gateGrid">
          {Array.from({ length: Math.min(airport.gates, 12) }).map((_, index) => (
            <span key={index} className={gateIssue && index === 0 ? "gate blocked" : "gate"} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RewardBars({ frame }: { frame: Frame }) {
  const rows = [
    ["Delay", frame.reward.delay_score],
    ["Safety", frame.reward.safety_score],
    ["Passengers", frame.reward.passenger_score],
    ["Money", frame.reward.money_score],
    ["Fairness", frame.reward.fairness_score],
  ] as const;
  return (
    <div className="rewardBars">
      {rows.map(([label, value]) => (
        <div key={label} className="barRow">
          <span>{label}</span>
          <div>
            <i
              style={{
                width: `${Math.min(100, Math.abs(value) * 2)}%`,
                marginLeft: value < 0 ? "auto" : 0,
              }}
              className={value < 0 ? "negative" : "positive"}
            />
          </div>
          <em>{value.toFixed(1)}</em>
        </div>
      ))}
    </div>
  );
}

function ModelComparison({ rows, selected }: { rows: TraceManifestRow[]; selected: string }) {
  const sorted = [...rows].sort((a, b) => b.total_reward - a.total_reward);
  return (
    <section className="modelTable">
      <h2>Policy Comparison</h2>
      {sorted.map((row) => (
        <div key={`${row.stage}-${row.policy}`} className={row.policy === selected ? "active" : ""}>
          <span>{policyLabels[row.policy] ?? row.policy}</span>
          <strong>{row.total_reward.toFixed(0)}</strong>
          <em>{row.total_dep_delay} delay min</em>
        </div>
      ))}
    </section>
  );
}

function SpeedControl({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="speedControl">
      <span>Replay speed</span>
      <div>
        {speeds.map((speed) => (
          <button
            key={speed.label}
            className={speed.ms === value ? "active" : ""}
            onClick={() => onChange(speed.ms)}
          >
            {speed.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Segmented<T extends string | number>({
  values,
  value,
  label,
  onChange,
}: {
  values: T[];
  value: T;
  label: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <div className="policySwitch">
      {values.map((item) => (
        <button key={String(item)} className={item === value ? "active" : ""} onClick={() => onChange(item)}>
          {label(item)}
        </button>
      ))}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
