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
import indiaGeoJson from "../../public/pitch/maps/india.json";
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

type GeoJsonPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

type GeoJsonMultiPolygon = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

type IndiaGeoJson = {
  type: "FeatureCollection";
  features: Array<{ geometry: GeoJsonPolygon | GeoJsonMultiPolygon }>;
};

const airports = airportsJson as Airport[];
const airlines = airlinesJson as Array<{ code: string; name: string; color: string }>;
const results = resultsJson as ResultRow[];
const replays = replaysJson as Record<string, Replay>;
const stages = stagesJson as Record<string, { label: string; title: string; headline: string }>;
const indiaMap = indiaGeoJson as IndiaGeoJson;

const modelOptions = Array.from(
  new Map(results.map((row) => [row.model, { id: row.model, label: row.label, short: row.short }])).values(),
);

const speeds = [
  { label: "0.5x", ms: 1800 },
  { label: "1x", ms: 1000 },
  { label: "2x", ms: 520 },
  { label: "4x", ms: 260 },
];

const airportBoardPositions: Record<string, { x: number; y: number }> = {
  DEL: { x: 47.8, y: 30.6 },
  AMD: { x: 35.8, y: 44.6 },
  BOM: { x: 34.4, y: 55.7 },
  PNQ: { x: 42.2, y: 58.7 },
  GOX: { x: 38.2, y: 68.8 },
  BLR: { x: 47.0, y: 78.4 },
  HYD: { x: 53.0, y: 61.5 },
  MAA: { x: 60.6, y: 77.8 },
  COK: { x: 44.4, y: 86.2 },
  CCU: { x: 74.2, y: 45.8 },
};

const stageAirportCodes: Record<number, string[]> = {
  1: ["DEL", "BOM", "BLR", "HYD"],
  2: ["DEL", "BOM", "BLR", "HYD", "PNQ", "GOX"],
  3: ["DEL", "BOM", "BLR", "HYD", "PNQ", "GOX", "MAA", "CCU"],
  4: ["DEL", "BOM", "BLR", "HYD", "PNQ", "GOX", "MAA", "CCU", "COK"],
};

const stageRouteLimit: Record<number, number> = {
  1: 4,
  2: 6,
  3: 8,
  4: 9,
};

export default function SimulationPage() {
  const [stage, setStage] = useState(4);
  const [model, setModel] = useState(modelOptions[0].id);
  const [mode, setMode] = useState<"base" | "rl">("rl");
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(1000);
  const [selectedAirport, setSelectedAirport] = useState("DEL");
  const [motionTick, setMotionTick] = useState(0);

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
  const displayFlights = visibleFlights(frame, stage);
  const displayMessages = visibleMessages(frame, stage, mode, replay.model_label);
  const visibleCodes = useMemo(() => new Set(stageAirportCodes[stage] ?? stageAirportCodes[4]), [stage]);

  useEffect(() => {
    setFrameIndex(0);
  }, [stage, model, mode]);

  useEffect(() => {
    if (!visibleCodes.has(selectedAirport)) {
      setSelectedAirport(stageAirportCodes[stage][0]);
    }
  }, [selectedAirport, stage, visibleCodes]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setFrameIndex((value) => (value + 1) % replay.frames.length);
    }, speedMs);
    return () => window.clearInterval(timer);
  }, [playing, replay.frames.length, speedMs]);

  useEffect(() => {
    if (!playing) return;
    let animationFrame = 0;
    let lastUpdate = 0;
    const animate = (timestamp: number) => {
      if (timestamp - lastUpdate > 32) {
        setMotionTick(timestamp / 1000);
        lastUpdate = timestamp;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [playing]);

  const selected = airports.find((airport) => airport.code === selectedAirport) ?? airports[0];
  const selectedFlights = displayFlights.filter(
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
            stage={stage}
            displayFlights={displayFlights}
            motionTick={motionTick}
            speedMs={speedMs}
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
            {controllerNarrative(stage, mode)}
          </p>
          <div className="bigReward">
            <span>Recovery score</span>
            <strong>{Math.round(frame.metrics.recovery_score)}</strong>
            <em>0-100 environment evaluator</em>
          </div>
          <KpiGrid frame={frame} stage={stage} />
          <SpeedControl value={speedMs} onChange={setSpeedMs} />
        </aside>
      </section>

      <section className="simGrid">
        <AirportZoom airport={selected} flights={selectedFlights} frame={frame} />
        <AgentChat messages={displayMessages} stage={stage} />
        <IncidentBoard frame={frame} />
      </section>

      <section className="simGrid bottom">
        {stage >= 3 ? <AirlineMoney frame={frame} /> : <StageFocus frame={frame} stage={stage} />}
        <ModelDeltaTable rows={stageRows} selected={model} onSelect={setModel} />
        <FlightManifest flights={displayFlights} stage={stage} />
      </section>

      <section className="proofStrip">
        <div>
          <p className="eyebrow">Base LLM vs RL-trained LLM</p>
          <h2>
            {modelBase?.label}: {modelBase?.score} base / {modelRl?.score} RL recovery score
          </h2>
        </div>
        <p>
          {proofNarrative(stage)}
        </p>
        <a href="/training/">Open training evidence</a>
      </section>
    </main>
  );
}

function IndiaMap({
  frame,
  stage,
  displayFlights,
  motionTick,
  speedMs,
  selectedAirport,
  onSelect,
}: {
  frame: Frame;
  stage: number;
  displayFlights: Flight[];
  motionTick: number;
  speedMs: number;
  selectedAirport: string;
  onSelect: (airport: string) => void;
}) {
  const visibleCodes = new Set(stageAirportCodes[stage] ?? stageAirportCodes[4]);
  const visibleAirports = airports.filter((airport) => visibleCodes.has(airport.code));
  const incidentAirports = new Set(
    frame.incidents.filter((item) => visibleCodes.has(item.airport)).map((item) => item.airport),
  );
  return (
    <div className="indiaMapV2">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <IndiaOutline />
        {stage >= 1 && <path className="airspaceSector primary" d="M39 27 H58 V64 H39 Z" />}
        {stage >= 2 && <path className="airspaceSector west" d="M31 43 H51 V72 H31 Z" />}
        {stage >= 3 && <path className="airspaceSector east" d="M50 38 H78 V65 H50 Z" />}
        {stage >= 4 && <path className="airspaceSector south" d="M38 68 H62 V93 H38 Z" />}
        {displayFlights.map((flight, index) => {
          const from = airportPoint(airports.find((airport) => airport.code === flight.origin));
          const to = airportPoint(airports.find((airport) => airport.code === flight.destination));
          const midX = (from.x + to.x) / 2;
          const midY = Math.min(from.y, to.y) - 5 - (index % 4) * 1.6;
          const speedScale = 1000 / speedMs;
          const progress = ((motionTick * 22 * speedScale + frame.time_index * 4 + index * 17) % 100) / 100;
          const planeX = quadratic(from.x, midX, to.x, progress);
          const planeY = quadratic(from.y, midY, to.y, progress);
          const tangentX = quadraticDerivative(from.x, midX, to.x, progress);
          const tangentY = quadraticDerivative(from.y, midY, to.y, progress);
          const angle = (Math.atan2(tangentY, tangentX) * 180) / Math.PI;
          return (
            <g key={flight.flight_id}>
              <path
                className={`flightArc ${flight.status === "cancelled" ? "cancelled" : ""} ${
                  flight.delay > 60 ? "late" : ""
                }`}
                d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                style={{ stroke: flight.color, animationDuration: `${Math.max(0.55, speedMs / 800)}s` }}
              />
              <g className="planeMotion" transform={`translate(${planeX} ${planeY}) rotate(${angle}) scale(0.82)`}>
                <path className="planeIcon" d="M0 -1.2 L4 0 L0 1.2 L0.8 0 L-3 0.9 L-2.4 0 L-3 -0.9 Z" />
              </g>
            </g>
          );
        })}
      </svg>
      {visibleAirports.map((airport) => {
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
      {displayFlights.slice(0, stage >= 3 ? 6 : 4).map((flight, index) => (
        <div className="flightChip" key={flight.flight_id} style={{ top: `${12 + index * 7.5}%` }}>
          <strong>{flight.flight_id}</strong>
          <span>
            {flight.origin} → {flight.destination}
          </span>
          <em>{flight.delay}m late</em>
        </div>
      ))}
      <div className="mapLegendV2">
        <strong>India airport recovery board</strong>
        <span>{mapLegend(stage)}</span>
      </div>
    </div>
  );
}

function IndiaOutline() {
  const paths = indiaMap.features.flatMap((feature, featureIndex) => {
    const geometry = feature.geometry;
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    return polygons.map((polygon, polygonIndex) => {
      const path = polygon
        .map((ring) =>
          ring
            .map(([lon, lat], index) => {
              const point = geoPoint(lon, lat);
              return `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
            })
            .join(" ")
            .concat(" Z"),
        )
        .join(" ");
      return <path className="indiaShapeV2" d={path} key={`${featureIndex}-${polygonIndex}`} />;
    });
  });
  return <>{paths}</>;
}

function quadratic(a: number, b: number, c: number, t: number) {
  return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
}

function quadraticDerivative(a: number, b: number, c: number, t: number) {
  return 2 * (1 - t) * (b - a) + 2 * t * (c - b);
}

function geoPoint(lon: number, lat: number) {
  const minLon = 67.2;
  const maxLon = 91.8;
  const minLat = 6.2;
  const maxLat = 36.7;
  return {
    x: 17 + ((lon - minLon) / (maxLon - minLon)) * 66,
    y: 4 + ((maxLat - lat) / (maxLat - minLat)) * 91,
  };
}

function airportPoint(airport?: Airport) {
  if (!airport) return { x: 50, y: 50 };
  return airportBoardPositions[airport.code] ?? geoPoint(airport.lon, airport.lat);
}

function KpiGrid({ frame, stage }: { frame: Frame; stage: number }) {
  const metrics = frame.metrics;
  return (
    <div className="kpiGrid">
      <Metric icon={<Plane size={17} />} label="arrived" value={metrics.flights_arrived} />
      <Metric icon={<AlertTriangle size={17} />} label="cancelled" value={metrics.flights_cancelled} />
      <Metric icon={<Gauge size={17} />} label="delay min" value={metrics.total_dep_delay.toLocaleString()} />
      {stage >= 2 && <Metric icon={<Smile size={17} />} label="satisfaction" value={`${metrics.avg_satisfaction}%`} />}
      <Metric icon={<RadioTower size={17} />} label="recovery score" value={Math.round(metrics.recovery_score)} />
      {stage >= 2 && <Metric icon={<Users size={17} />} label="stranded pax" value={metrics.stranded_passengers.toLocaleString()} />}
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

function StageFocus({ frame, stage }: { frame: Frame; stage: number }) {
  const metrics = frame.metrics;
  const activeIncident = frame.incidents[0];
  const rows =
    stage === 1
      ? [
          ["Safe arrivals", metrics.flights_arrived],
          ["Delay minutes", metrics.total_dep_delay.toLocaleString()],
          ["Cancelled flights", metrics.flights_cancelled],
          ["Active crisis", activeIncident ? activeIncident.title : "Network nominal"],
        ]
      : [
          ["Passenger satisfaction", `${metrics.avg_satisfaction}%`],
          ["Stranded passengers", metrics.stranded_passengers.toLocaleString()],
          ["Delay minutes", metrics.total_dep_delay.toLocaleString()],
          ["Active crisis", activeIncident ? activeIncident.title : "Network nominal"],
        ];
  return (
    <section className="panelV2 stageFocus">
      <div className="panelTitle">
        {stage === 1 ? <RadioTower size={18} /> : <Users size={18} />}
        <h2>{stage === 1 ? "Operations Pressure" : "Passenger Recovery Pressure"}</h2>
      </div>
      {rows.map(([label, value]) => (
        <div className="focusRow" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
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
            {rl?.score} RL / {base?.score} base
          </strong>
          <em>
            {rl?.cancelled} RL / {base?.cancelled} base cancels
          </em>
        </button>
      ))}
    </section>
  );
}

function FlightManifest({ flights, stage }: { flights: Flight[]; stage: number }) {
  return (
    <section className="panelV2 flightManifest">
      <h2>{stage === 1 ? "Operational Flights" : "Live Flights"}</h2>
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

function visibleFlights(frame: Frame, stage: number) {
  const codes = new Set(stageAirportCodes[stage] ?? stageAirportCodes[4]);
  const limit = stageRouteLimit[stage] ?? 8;
  const filtered = frame.flights.filter((flight) => codes.has(flight.origin) && codes.has(flight.destination));
  const uniqueRoutes: Flight[] = [];
  const seen = new Set<string>();
  for (const flight of filtered) {
    const key = `${flight.origin}-${flight.destination}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueRoutes.push(flight);
    if (uniqueRoutes.length >= limit) break;
  }
  return uniqueRoutes;
}

function controllerNarrative(stage: number, mode: "base" | "rl") {
  if (mode === "base") {
    if (stage === 1) return "This is normally handled by expert operations controllers; the base model reacts late to runway, aircraft, and crew constraints.";
    if (stage === 2) return "The base model sees the schedule, but misses passenger knock-on effects such as connections, stranded groups, and emergency priority.";
    return "This is normally a human-led operations-control problem; the base model reacts late and lets constraints cascade.";
  }
  if (stage === 1) return "The agent has learned safe sequencing: depart ready aircraft, hold illegal rotations, and recover the compact network without pretending the crisis is perfect.";
  if (stage === 2) return "The agent has learned passenger-aware recovery: protect connections, contain stranded groups, and trade small delays against larger human impact.";
  if (stage === 3) return "The agent has learned multi-agent control: balance airline pressure, scarce slots, passenger harm, fairness, and cash.";
  return "The agent has learned crisis recovery under crew collapse: cancel only unrecoverable rotations, protect legal crews, and reduce passenger harm.";
}

function proofNarrative(stage: number) {
  if (stage === 1) {
    return "The RL-trained controller keeps more aircraft moving while reducing unsafe holds, late departures, and cancellations under the same operational disruption load.";
  }
  if (stage === 2) {
    return "The RL-trained controller recovers the same network while protecting passenger connections, reducing stranded groups, and keeping satisfaction higher.";
  }
  return "The RL-trained controller keeps more aircraft moving while protecting crew legality, passenger connections, airline economics, and airport fairness under the same disruption load.";
}

function mapLegend(stage: number) {
  if (stage === 1) return "L1 compact ops network: DEL, BOM, BLR, HYD";
  if (stage === 2) return "L2 passenger network adds PNQ and GOX recovery pressure";
  if (stage === 3) return "L3 economic network adds eastern and southern slot pressure";
  return "L4 crisis replay: national cancellation and crew-rotation recovery";
}

function visibleMessages(frame: Frame, stage: number, mode: "base" | "rl", modelLabel: string) {
  const controller = `${modelLabel.split(" ")[0]} ${mode === "rl" ? "RL" : "Base"}`;
  const incident = frame.incidents[0];
  if (stage === 1) {
    return [
      {
        from: controller,
        to: "Tower Central",
        message:
          mode === "rl"
            ? "Sequence only ready aircraft, hold illegal crew rotations, and keep DEL-BOM-BLR-HYD moving without unsafe shortcuts."
            : "Attempts broad holds; aircraft readiness and runway capacity are not separated cleanly.",
      },
      {
        from: "Tower Central",
        to: "Airport Ops",
        message: incident
          ? `${incident.title} active at ${incident.airport}. Prioritize safe departures and keep runway conflicts at zero.`
          : "Network nominal. Continue safe dispatch sequencing.",
      },
      {
        from: "Airport Ops",
        to: "Tower Central",
        message: "Ready flights are released first; blocked aircraft wait for maintenance or crew recovery.",
      },
    ];
  }
  if (stage === 2) {
    return [
      {
        from: controller,
        to: "Passenger Recovery",
        message:
          mode === "rl"
            ? "Protect connection banks and emergency priority before optimizing raw delay minutes."
            : "Treats several delayed flights independently and misses passenger spillover risk.",
      },
      {
        from: "Passenger Recovery",
        to: "Tower Central",
        message: "Connection groups are flagged; avoid stranding passengers when a short hold can preserve the onward bank.",
      },
      {
        from: "Airport Ops",
        to: "Passenger Recovery",
        message: incident
          ? `${incident.airport} pressure is live. Gate and runway choices now affect passenger satisfaction.`
          : "Passenger recovery layer is monitoring connection and satisfaction risk.",
      },
    ];
  }
  return frame.messages;
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
