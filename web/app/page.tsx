"use client";

import { Activity, AlertTriangle, Gauge, Plane, Play, RotateCcw, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Airport, Frame, Trace } from "../lib/types";

const airportPositions: Record<string, { x: number; y: number }> = {
  DEL: { x: 46, y: 25 },
  BOM: { x: 32, y: 58 },
  BLR: { x: 44, y: 75 },
  HYD: { x: 49, y: 62 },
  MAA: { x: 55, y: 79 },
  CCU: { x: 73, y: 47 },
  AMD: { x: 31, y: 44 },
  COK: { x: 42, y: 86 },
};

export default function Home() {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [selectedAirport, setSelectedAirport] = useState("DEL");
  const [traceName, setTraceName] = useState("recovery_heuristic_stage2_seed7");

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
    }, 900);
    return () => window.clearInterval(timer);
  }, [playing, trace]);

  const frame = trace?.frames[frameIndex];
  const airports = frame?.observation.airports ?? [];
  const selected = airports.find((airport) => airport.code === selectedAirport) ?? airports[0];

  const routes = useMemo(() => {
    const pending = frame?.observation.pending_decisions.slice(0, 10) ?? [];
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
    <main className="shell">
      <section className="stage">
        <header className="topbar">
          <div>
            <p className="eyebrow">Runway Zero</p>
            <h1>Indian Airport Crisis Recovery</h1>
          </div>
          <div className="policySwitch" aria-label="policy selector">
            <button
              className={traceName === "fifo_stage2_seed7" ? "active" : ""}
              onClick={() => setTraceName("fifo_stage2_seed7")}
            >
              FIFO
            </button>
            <button
              className={traceName === "recovery_heuristic_stage2_seed7" ? "active" : ""}
              onClick={() => setTraceName("recovery_heuristic_stage2_seed7")}
            >
              Recovery Agent
            </button>
          </div>
          <div className="clock">
            <span>{frame.observation.clock}</span>
            <button aria-label="toggle replay" onClick={() => setPlaying((value) => !value)}>
              {playing ? <Activity size={18} /> : <Play size={18} />}
            </button>
            <button aria-label="restart replay" onClick={() => setFrameIndex(0)}>
              <RotateCcw size={18} />
            </button>
          </div>
        </header>

        <div className="mapPanel">
          <div className="indiaShape" />
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
                  cx={(route.origin.x * 0.45 + route.destination.x * 0.55).toFixed(2)}
                  cy={(route.origin.y * 0.45 + route.destination.y * 0.55).toFixed(2)}
                  r="0.9"
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

        <AirportPanel airport={selected} time={frame.time} />
      </section>

      <aside className="side">
        <div className="scoreCard">
          <div className="scoreTitle">
            <Gauge size={18} />
            <span>Reward Delta</span>
          </div>
          <strong>{frame.reward.total.toFixed(1)}</strong>
          <RewardBars frame={frame} />
        </div>

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

        <section className="feed">
          <h2>Live Agent Decisions</h2>
          {frame.actions.slice(0, 7).map((action, index) => (
            <article key={`${frame.time}-${index}`}>
              <span>{String(action.action)}</span>
              <p>{String(action.flight_id ?? action.aircraft_id ?? "network")}</p>
            </article>
          ))}
          {!frame.actions.length && <p className="empty">No action this timestep.</p>}
        </section>

        <section className="feed disruptions">
          <h2>Active Disruptions</h2>
          {frame.active_disruptions.map((item) => (
            <article key={item.disruption_id}>
              <span>{item.kind.replace("_", " ")}</span>
              <p>{item.message}</p>
            </article>
          ))}
          {!frame.active_disruptions.length && <p className="empty">Network nominal.</p>}
        </section>

        <section className="feed">
          <h2>Evidence</h2>
          <article>
            <span>policy</span>
            <p>{trace.policy.replace("_", " ")}</p>
          </article>
          <article>
            <span>stage</span>
            <p>Stage {trace.stage}: operations + passenger satisfaction</p>
          </article>
          <article>
            <span>metric</span>
            <p>Reward, delay, cancellation, stranded passenger, and satisfaction plots are generated from simulator rollouts.</p>
          </article>
        </section>
      </aside>
    </main>
  );
}

function AirportPanel({ airport, time }: { airport?: Airport; time: number }) {
  if (!airport) return null;
  const runwayIssue = airport.runway_closed_until > time;
  const gateIssue = airport.gate_blocked_until > time;
  return (
    <section className="airportPanel">
      <div>
        <p className="eyebrow">Airport Zoom</p>
        <h2>
          {airport.city} <span>{airport.code}</span>
        </h2>
      </div>
      <div className="runwayGrid">
        {Array.from({ length: airport.runways }).map((_, index) => (
          <div key={index} className={`runway ${runwayIssue && index === 0 ? "closed" : ""}`}>
            RWY {index + 1}
          </div>
        ))}
      </div>
      <div className="gateGrid">
        {Array.from({ length: Math.min(airport.gates, 10) }).map((_, index) => (
          <span key={index} className={gateIssue && index === 0 ? "gate blocked" : "gate"} />
        ))}
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
