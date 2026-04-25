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
import type { Airport, Frame, ModelComparisonRow, Trace } from "../../lib/types";

const policyLabels: Record<string, string> = {
  random: "Base Model",
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
  { id: "google/gemma-4-31B-it", label: "Gemma 4 31B" },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
  { id: "Qwen/Qwen2.5-Coder-7B-Instruct", label: "Qwen2.5 Coder 7B" },
  { id: "Qwen/Qwen3-14B", label: "Qwen3 14B" },
];

export default function Home() {
  const [modelRows, setModelRows] = useState<ModelComparisonRow[]>([]);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [stage, setStage] = useState(2);
  const [policy, setPolicy] = useState("trained_rl");
  const [model, setModel] = useState(modelLineup[2].id);
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
    fetch(`/traces/${traceName}.json`)
      .then((response) => response.json())
      .then((payload: Trace) => {
        setTrace(payload);
        setFrameIndex(0);
      });
  }, [traceName]);

  useEffect(() => {
    fetch("/models/model_comparison.json")
      .then((response) => response.json())
      .then((payload: ModelComparisonRow[]) => setModelRows(payload));
  }, []);

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
  const modelStageRows = modelRows.filter((row) => row.stage === stage);

  const routes = useMemo(() => {
    const pending = frame?.observation.pending_decisions.slice(0, 14) ?? [];
    return pending
      .map((flight) => ({
        id: flight.flight_id,
        origin: airportPoint(airports.find((airport) => airport.code === flight.origin)),
        destination: airportPoint(airports.find((airport) => airport.code === flight.destination)),
        delay: flight.delay_minutes,
      }))
      .filter((route) => route.origin && route.destination);
  }, [airports, frame]);

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
            values={["random", "trained_rl"]}
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
          <svg className="indiaBoard" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path
              className="indiaShape"
              d="M40 4 L54 8 L63 18 L69 30 L82 40 L76 52 L72 62 L70 75 L58 96 L48 82 L42 70 L32 62 L30 52 L24 44 L28 34 L24 25 L34 18 Z"
            />
            <path className="coastLine" d="M36 19 C29 35 31 50 40 67 C45 78 49 86 56 94" />
            <path className="coastLine" d="M57 10 C64 26 72 35 80 42 C74 52 71 66 68 78" />
            {routes.map((route, index) => (
              <g key={`${route.id}-${index}`}>
                <path
                  d={`M ${route.origin.x} ${route.origin.y} Q ${
                    (route.origin.x + route.destination.x) / 2
                  } ${Math.min(route.origin.y, route.destination.y) - 10} ${route.destination.x} ${
                    route.destination.y
                  }`}
                  className={route.delay > 45 ? "route delayed" : "route"}
                />
                <polygon
                  className="planeGlyph"
                  points="-1.2,-0.7 1.4,0 -1.2,0.7 -0.4,0"
                  transform={`translate(${(route.origin.x * 0.38 + route.destination.x * 0.62).toFixed(
                    2,
                  )} ${(route.origin.y * 0.38 + route.destination.y * 0.62).toFixed(2)})`}
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
                left: `${airportPoint(airport).x}%`,
                top: `${airportPoint(airport).y}%`,
              }}
              onClick={() => setSelectedAirport(airport.code)}
            >
              <span>{airport.code}</span>
              <em>{airport.city}</em>
            </button>
          ))}
          <div className="mapLegend">
            <span>India ops board</span>
            <strong>{frame.active_disruptions.length} live incidents</strong>
          </div>
        </div>

        <section className="missionPanel">
          <p className="eyebrow">{stageLabels[stage]}</p>
          <h2>{frame.observation.challenge_brief?.title ?? policyLabels[policy]}</h2>
          <p className="missionCopy">{frame.observation.challenge_brief?.goal}</p>
          <div className="score">
            <span>Total reward</span>
            <strong>{trace.total_reward.toFixed(1)}</strong>
          </div>
          <IncidentStack frame={frame} />
          <RewardBars frame={frame} />
          <SpeedControl value={speedMs} onChange={setSpeedMs} />
        </section>
      </section>

      <section className="opsGrid">
        <AirportPanel airport={selected} time={frame.time} frame={frame} />
        <section className="feed comms">
          <h2>Live Agent Negotiation</h2>
          {frame.agent_messages.slice(0, 12).map((item, index) => (
            <article key={`${frame.time}-message-${index}`}>
              <span>
                {item.from} → {item.to}
              </span>
              <p>{item.message}</p>
            </article>
          ))}
        </section>
        <section className="feed">
          <h2>What Is Going Wrong</h2>
          {frame.active_disruptions.map((item) => (
            <article key={item.disruption_id}>
              <span>
                {item.kind.replace("_", " ")} · severity {item.severity}
              </span>
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
        <ModelComparison rows={modelStageRows} selected={model} onSelect={setModel} />
        <section className="modelLineup">
          <div className="scoreTitle">
            <SlidersHorizontal size={18} />
            <span>Selected model role</span>
          </div>
          {modelLineup.map((item) => (
            <button
              className={item.id === model ? "modelChoice active" : "modelChoice"}
              key={item.id}
              onClick={() => setModel(item.id)}
            >
              {item.label}
            </button>
          ))}
          <p className="modelNote">
            The replay toggles base behavior against the environment-trained controller. HF GRPO jobs
            replace these rows with exact per-model scores when complete.
          </p>
        </section>
      </section>
    </main>
  );
}

function airportPoint(airport?: Airport) {
  if (!airport) return { x: 50, y: 50 };
  const minLon = 68;
  const maxLon = 90.5;
  const minLat = 8;
  const maxLat = 34.5;
  return {
    x: 14 + ((airport.lon - minLon) / (maxLon - minLon)) * 72,
    y: 7 + ((maxLat - airport.lat) / (maxLat - minLat)) * 86,
  };
}

function AirportPanel({ airport, time, frame }: { airport?: Airport; time: number; frame: Frame }) {
  if (!airport) return null;
  const runwayIssue = airport.runway_closed_until > time;
  const gateIssue = airport.gate_blocked_until > time;
  const queue = frame.observation.pending_decisions.filter((flight) => flight.origin === airport.code).slice(0, 10);
  return (
    <section className="airportPanel">
      <div className="airportGame">
        <div className="terminalBlock">
          <strong>{airport.code}</strong>
          <span>{airport.city} ops</span>
        </div>
        <div className="taxiway" />
        <div className="queueLine">
          {queue.map((flight, index) => (
            <span
              key={flight.flight_id}
              className={flight.delay_minutes > 60 ? "queuedPlane late" : "queuedPlane"}
              style={{ left: `${8 + index * 8}%` }}
            >
              {flight.airline}
            </span>
          ))}
        </div>
      </div>
      <div className="airportDetails">
        <p className="eyebrow">Airport Zoom</p>
        <h2>
          {airport.city} <span>{airport.code}</span>
        </h2>
        <div className="runwayGrid">
          {Array.from({ length: airport.runways }).map((_, index) => (
            <div key={index} className={`runway ${runwayIssue && index === 0 ? "closed" : ""}`}>
              <span>RWY {index + 1}</span>
              <i />
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

function IncidentStack({ frame }: { frame: Frame }) {
  const topDecision = frame.observation.pending_decisions[0];
  return (
    <div className="incidentStack">
      <span>Current pressure</span>
      {frame.active_disruptions[0] ? (
        <strong>{frame.active_disruptions[0].message}</strong>
      ) : (
        <strong>No live incident. Preparing next departure wave.</strong>
      )}
      {topDecision && (
        <p>
          Next decision: {topDecision.flight_id} {topDecision.origin} → {topDecision.destination},{" "}
          {topDecision.delay_minutes} min late, {topDecision.passengers} passengers.
        </p>
      )}
    </div>
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

function ModelComparison({
  rows,
  selected,
  onSelect,
}: {
  rows: ModelComparisonRow[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const sorted = [...rows].sort((a, b) => b.rl_trained_reward - a.rl_trained_reward);
  return (
    <section className="modelTable">
      <h2>Base vs RL-Trained Models</h2>
      {sorted.map((row) => (
        <button
          key={`${row.stage}-${row.model}`}
          className={row.model === selected ? "active" : ""}
          onClick={() => onSelect(row.model)}
        >
          <span>{row.label}</span>
          <strong>
            {row.base_reward.toFixed(0)} → {row.rl_trained_reward.toFixed(0)}
          </strong>
          <em>
            delay {row.base_delay} → {row.rl_trained_delay}
          </em>
        </button>
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
