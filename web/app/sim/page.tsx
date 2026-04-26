"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Clock3,
  Gauge,
  Pause,
  Plane,
  Play,
  RadioTower,
  RotateCcw,
  Smile,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import airportsJson from "../../public/pitch/airports.json";
import airlinesJson from "../../public/pitch/airlines.json";
import resultsJson from "../../public/pitch/model_results.json";
import replaysJson from "../../public/pitch/replays.json";
import stagesJson from "../../public/pitch/stages.json";

type Airport = {
  code: string;
  city: string;
  lat: number;
  lon: number;
  runways: number;
  gates: number;
};

type Flight = {
  flight_id: string;
  airline: string;
  airline_code: string;
  color: string;
  origin: string;
  destination: string;
  delay: number;
  passengers: number;
  status: string;
  satisfaction: number;
};

type Frame = {
  clock: string;
  time_index: number;
  headline: string;
  metrics: {
    flights_total: number;
    flights_arrived: number;
    flights_cancelled: number;
    total_dep_delay: number;
    stranded_passengers: number;
    avg_satisfaction: number;
    recovery_score: number;
    airline_cash: Record<string, number>;
  };
  incidents: Array<{ airport: string; title: string; severity: number; message: string }>;
  flights: Flight[];
  messages: Array<{ from: string; to: string; message: string }>;
};

type Replay = {
  stage: number;
  model: string;
  model_label: string;
  mode: "base" | "rl";
  title: string;
  score: number;
  reward: number;
  raw_reward: number;
  summary: Frame["metrics"];
  frames: Frame[];
};

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

const airports = airportsJson as Airport[];
const airlines = airlinesJson as Array<{ code: string; name: string; color: string }>;
const results = resultsJson as ResultRow[];
const replays = replaysJson as Record<string, Replay>;
const stages = stagesJson as Record<string, { label: string; title: string; headline: string }>;

const modelOptions = Array.from(
  new Map(results.map((row) => [row.model, { id: row.model, label: row.label, short: row.short }])).values(),
);

const speeds = [
  { label: "0.5x", ms: 1800 },
  { label: "1x", ms: 1000 },
  { label: "2x", ms: 520 },
  { label: "4x", ms: 260 },
];

export default function SimulationPage() {
  const [stage, setStage] = useState(4);
  const [model, setModel] = useState(modelOptions[0].id);
  const [mode, setMode] = useState<"base" | "rl">("rl");
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(1000);
  const [selectedAirport, setSelectedAirport] = useState("DEL");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedStage = Number(params.get("stage"));
    if ([1, 2, 3, 4].includes(requestedStage)) setStage(requestedStage);
  }, []);

  const replay = replays[`stage${stage}:${model}:${mode}`] ?? Object.values(replays)[0];
  const frame = replay.frames[Math.min(frameIndex, replay.frames.length - 1)];
  const stageRows = results.filter((row) => row.stage === stage);
  const modelBase = stageRows.find((row) => row.model === model && row.mode === "base");
  const modelRl = stageRows.find((row) => row.model === model && row.mode === "rl");

  useEffect(() => {
    setFrameIndex(0);
  }, [stage, model, mode]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setFrameIndex((value) => (value + 1) % replay.frames.length);
    }, speedMs);
    return () => window.clearInterval(timer);
  }, [playing, replay.frames.length, speedMs]);

  const selected = airports.find((airport) => airport.code === selectedAirport) ?? airports[0];
  const selectedFlights = frame.flights.filter(
    (flight) => flight.origin === selected.code || flight.destination === selected.code,
  );

  return (
    <main className="simPage">
      <header className="simTopbar">
        <a className="backLink topbarBack" href="/">
          <ArrowLeft size={17} /> Runway Zero
        </a>
        <div>
          <p className="eyebrow">Live Crisis Replay</p>
          <h1>{stages[String(stage)].title}</h1>
        </div>
        <div className="simControls">
          <Segmented values={[1, 2, 3, 4]} value={stage} label={(value) => `L${value}`} onChange={setStage} />
          <Segmented
            values={["base", "rl"] as const}
            value={mode}
            label={(value) => (value === "base" ? "Base LLM" : "RL-trained LLM")}
            onChange={setMode}
          />
          <select value={model} onChange={(event) => setModel(event.target.value)} aria-label="model">
            {modelOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <div className="clockBox">
            <Clock3 size={16} />
            <strong>{frame.clock}</strong>
          </div>
          <button className="iconButton" onClick={() => setPlaying((value) => !value)} aria-label="toggle replay">
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button className="iconButton" onClick={() => setFrameIndex(0)} aria-label="restart replay">
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      <section className="crisisHero">
        <div className="mapPanelV2">
          <IndiaMap
            frame={frame}
            selectedAirport={selectedAirport}
            onSelect={setSelectedAirport}
          />
          <div className="mapBrief">
            <span>{mode === "base" ? "Base LLM failure mode" : "RL recovery mode"}</span>
            <strong>{frame.headline}</strong>
          </div>
        </div>

        <aside className="judgePanel">
          <p className="eyebrow">{stages[String(stage)].label}</p>
          <h2>{replay.model_label}</h2>
          <div className={mode === "rl" ? "modeBadge good" : "modeBadge bad"}>
            {mode === "rl" ? "RL-trained controller" : "Base LLM controller"}
          </div>
          <p>
            {mode === "rl"
              ? "The agent has learned to trade off runway capacity, passenger harm, crew legality, and airline cash."
              : "The base model reacts late, over-holds flights, misses crew legality, and lets cancellations cascade."}
          </p>
          <div className="bigReward">
            <span>Recovery score</span>
            <strong>{Math.round(frame.metrics.recovery_score)}</strong>
            <em>0-100 environment evaluator</em>
          </div>
          <div className="technicalReward">
            raw reward: {replay.raw_reward.toLocaleString()} · shown as score for the pitch UI
          </div>
          <KpiGrid frame={frame} />
          <SpeedControl value={speedMs} onChange={setSpeedMs} />
        </aside>
      </section>

      <section className="simGrid">
        <AirportZoom airport={selected} flights={selectedFlights} frame={frame} />
        <AgentChat messages={frame.messages} stage={stage} />
        <IncidentBoard frame={frame} />
      </section>

      <section className="simGrid bottom">
        <AirlineMoney frame={frame} />
        <ModelDeltaTable rows={stageRows} selected={model} onSelect={setModel} />
        <FlightManifest flights={frame.flights} />
      </section>

      <section className="proofStrip">
        <div>
          <p className="eyebrow">Before vs After RL</p>
          <h2>
            {modelBase?.label}: {modelBase?.score} → {modelRl?.score} recovery score
          </h2>
        </div>
        <p>
          Delay drops from {modelBase?.delay.toLocaleString()} to {modelRl?.delay.toLocaleString()} minutes,
          cancellations drop from {modelBase?.cancelled} to {modelRl?.cancelled}, and satisfaction rises from{" "}
          {modelBase?.satisfaction}% to {modelRl?.satisfaction}%.
        </p>
        <a href="/training/">Open training evidence</a>
      </section>
    </main>
  );
}

function IndiaMap({
  frame,
  selectedAirport,
  onSelect,
}: {
  frame: Frame;
  selectedAirport: string;
  onSelect: (airport: string) => void;
}) {
  const incidentAirports = new Set(frame.incidents.map((item) => item.airport));
  return (
    <div className="indiaMapV2">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <path
          className="indiaShapeV2"
          d="M37 5 L58 8 L66 14 L74 18 L78 27 L87 32 L79 39 L68 42 L70 56 L65 70 L57 81 L48 94 L39 82 L34 71 L27 61 L23 50 L22 39 L26 30 L21 23 L31 18 Z"
        />
        <path className="airspaceSector" d="M26 16 H78 V43 H26 Z" />
        <path className="airspaceSector" d="M22 43 H71 V72 H22 Z" />
        <path className="airspaceSector" d="M33 72 H65 V96 H33 Z" />
        <path className="indiaCoastV2" d="M30 20 C23 33 22 47 28 61 C34 74 40 86 50 95" />
        <path className="indiaCoastV2" d="M58 9 C63 18 69 27 82 36 C75 46 68 56 65 73" />
        {frame.flights.map((flight, index) => {
          const from = airportPoint(airports.find((airport) => airport.code === flight.origin));
          const to = airportPoint(airports.find((airport) => airport.code === flight.destination));
          const midX = (from.x + to.x) / 2;
          const midY = Math.min(from.y, to.y) - 7 - (index % 3) * 2;
          const progress = ((frame.time_index * 13 + index * 11) % 100) / 100;
          const planeX = quadratic(from.x, midX, to.x, progress);
          const planeY = quadratic(from.y, midY, to.y, progress);
          return (
            <g key={flight.flight_id}>
              <path
                className={`flightArc ${flight.status === "cancelled" ? "cancelled" : ""} ${
                  flight.delay > 60 ? "late" : ""
                }`}
                d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                style={{ stroke: flight.color }}
              />
              <g transform={`translate(${planeX} ${planeY}) rotate(${to.x > from.x ? 8 : -8})`}>
                <path className="planeIcon" d="M0 -1.2 L4 0 L0 1.2 L0.8 0 L-3 0.9 L-2.4 0 L-3 -0.9 Z" />
              </g>
            </g>
          );
        })}
      </svg>
      {airports.map((airport) => {
        const point = airportPoint(airport);
        const incident = incidentAirports.has(airport.code);
        return (
          <button
            key={airport.code}
            className={`airportNodeV2 ${airport.code === selectedAirport ? "selected" : ""} ${
              incident ? "incident" : ""
            }`}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            onClick={() => onSelect(airport.code)}
          >
            {incident && <span className="incidentPulse">!</span>}
            <strong>{airport.code}</strong>
            <em>{airport.city}</em>
          </button>
        );
      })}
      {frame.flights.slice(0, 6).map((flight, index) => (
        <div className="flightChip" key={flight.flight_id} style={{ top: `${8 + index * 8}%` }}>
          <strong>{flight.flight_id}</strong>
          <span>
            {flight.origin} → {flight.destination}
          </span>
          <em>{flight.delay}m late</em>
        </div>
      ))}
      <div className="mapLegendV2">
        <strong>India airport recovery board</strong>
        <span>nodes are real airport coordinates · arcs are active simulated flights</span>
      </div>
    </div>
  );
}

function quadratic(a: number, b: number, c: number, t: number) {
  return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
}

function airportPoint(airport?: Airport) {
  if (!airport) return { x: 50, y: 50 };
  const minLon = 68;
  const maxLon = 90.5;
  const minLat = 7.5;
  const maxLat = 35.5;
  return {
    x: 14 + ((airport.lon - minLon) / (maxLon - minLon)) * 72,
    y: 6 + ((maxLat - airport.lat) / (maxLat - minLat)) * 88,
  };
}

function KpiGrid({ frame }: { frame: Frame }) {
  const metrics = frame.metrics;
  return (
    <div className="kpiGrid">
      <Metric icon={<Plane size={17} />} label="arrived" value={metrics.flights_arrived} />
      <Metric icon={<AlertTriangle size={17} />} label="cancelled" value={metrics.flights_cancelled} />
      <Metric icon={<Gauge size={17} />} label="delay min" value={metrics.total_dep_delay.toLocaleString()} />
      <Metric icon={<Smile size={17} />} label="satisfaction" value={`${metrics.avg_satisfaction}%`} />
      <Metric icon={<RadioTower size={17} />} label="recovery score" value={Math.round(metrics.recovery_score)} />
      <Metric icon={<Users size={17} />} label="stranded pax" value={metrics.stranded_passengers.toLocaleString()} />
    </div>
  );
}

function AirportZoom({ airport, flights, frame }: { airport: Airport; flights: Flight[]; frame: Frame }) {
  const incident = frame.incidents.find((item) => item.airport === airport.code);
  return (
    <section className="airportZoomV2">
      <div className="airportScene">
        <div className="terminalV2">
          <strong>{airport.code}</strong>
          <span>{airport.city}</span>
        </div>
        <div className={incident ? "runwayV2 broken" : "runwayV2"}>
          <span>{incident ? "RUNWAY CONSTRAINED" : "RUNWAY ACTIVE"}</span>
        </div>
        <div className="gateRowV2">
          {Array.from({ length: Math.min(airport.gates, 10) }).map((_, index) => (
            <i key={index} className={incident && index < 2 ? "blocked" : ""} />
          ))}
        </div>
        {flights.slice(0, 5).map((flight, index) => (
          <div
            className={`groundPlane ${flight.status}`}
            key={flight.flight_id}
            style={{ left: `${12 + index * 14}%` }}
          >
            {flight.airline_code}
          </div>
        ))}
      </div>
      <div className="panelBody">
        <p className="eyebrow">Airport Zoom</p>
        <h2>
          {airport.city} <span>{airport.code}</span>
        </h2>
        {incident ? (
          <div className="incidentCallout">
            <strong>{incident.title}</strong>
            <p>{incident.message}</p>
          </div>
        ) : (
          <p className="muted">No active local incident. Airport is absorbing network spillover.</p>
        )}
      </div>
    </section>
  );
}

function AgentChat({ messages, stage }: { messages: Frame["messages"]; stage: number }) {
  return (
    <section className="panelV2">
      <div className="panelTitle">
        <RadioTower size={18} />
        <h2>{stage >= 3 ? "Live Multi-Agent Negotiation" : "Controller Reasoning"}</h2>
      </div>
      {messages.map((message, index) => (
        <article className="chatLine" key={`${message.from}-${index}`}>
          <span>
            {message.from} → {message.to}
          </span>
          <p>{message.message}</p>
        </article>
      ))}
    </section>
  );
}

function IncidentBoard({ frame }: { frame: Frame }) {
  return (
    <section className="panelV2">
      <div className="panelTitle">
        <AlertTriangle size={18} />
        <h2>What Is Going Wrong</h2>
      </div>
      {frame.incidents.map((incident) => (
        <article className="incidentLine" key={incident.title}>
          <strong>
            {incident.airport} · {incident.title}
          </strong>
          <span>Severity {incident.severity}</span>
          <p>{incident.message}</p>
        </article>
      ))}
    </section>
  );
}

function AirlineMoney({ frame }: { frame: Frame }) {
  const maxCash = Math.max(...Object.values(frame.metrics.airline_cash));
  return (
    <section className="panelV2">
      <div className="panelTitle">
        <Banknote size={18} />
        <h2>Airline Cash Pressure</h2>
      </div>
      {airlines.map((airline) => {
        const cash = frame.metrics.airline_cash[airline.code] ?? 0;
        return (
          <div className="moneyRow" key={airline.code}>
            <span>{airline.name}</span>
            <div>
              <i style={{ width: `${Math.max(4, (cash / maxCash) * 100)}%`, background: airline.color }} />
            </div>
            <strong>₹{Math.round(cash / 100000)}L</strong>
          </div>
        );
      })}
    </section>
  );
}

function ModelDeltaTable({
  rows,
  selected,
  onSelect,
}: {
  rows: ResultRow[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const pairs = modelOptions.map((model) => ({
    model,
    base: rows.find((row) => row.model === model.id && row.mode === "base"),
    rl: rows.find((row) => row.model === model.id && row.mode === "rl"),
  }));
  return (
    <section className="panelV2 modelDelta">
      <h2>Base LLM vs RL-trained LLM</h2>
      {pairs.map(({ model, base, rl }) => (
        <button className={selected === model.id ? "active" : ""} key={model.id} onClick={() => onSelect(model.id)}>
          <span>{model.label}</span>
          <strong>
            {base?.score} → {rl?.score}
          </strong>
          <em>
            {base?.cancelled} → {rl?.cancelled} cancels
          </em>
        </button>
      ))}
    </section>
  );
}

function FlightManifest({ flights }: { flights: Flight[] }) {
  return (
    <section className="panelV2 flightManifest">
      <h2>Live Flights</h2>
      {flights.slice(0, 8).map((flight) => (
        <article key={flight.flight_id}>
          <strong>{flight.flight_id}</strong>
          <span>
            {flight.airline} · {flight.origin} → {flight.destination}
          </span>
          <em>
            {flight.delay}m late · {flight.passengers} pax · {Math.round(flight.satisfaction)}%
          </em>
        </article>
      ))}
    </section>
  );
}

function SpeedControl({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="speedControlV2">
      <span>Replay speed</span>
      <div>
        {speeds.map((speed) => (
          <button key={speed.label} className={speed.ms === value ? "active" : ""} onClick={() => onChange(speed.ms)}>
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
  values: readonly T[];
  value: T;
  label: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmentedV2">
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
    <div className="metricV2">
      {icon}
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
