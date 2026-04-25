export type Airport = {
  code: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  runways: number;
  gates: number;
  runway_closed_until: number;
  gate_blocked_until: number;
  weather_delay: number;
  emergency_priority: boolean;
};

export type PendingDecision = {
  flight_id: string;
  airline: string;
  origin: string;
  destination: string;
  scheduled_dep: number;
  scheduled_arr: number;
  delay_minutes: number;
  passengers: number;
  priority: string;
  aircraft_ready: boolean;
  crew_ready: boolean;
  weather_delay: number;
};

export type Reward = {
  delay_score: number;
  safety_score: number;
  passenger_score: number;
  money_score: number;
  fairness_score: number;
  action_validity_score: number;
  total: number;
};

export type Metrics = {
  flights_total: number;
  flights_arrived: number;
  flights_cancelled: number;
  flights_active: number;
  total_dep_delay: number;
  total_arr_delay: number;
  stranded_passengers: number;
  avg_satisfaction: number;
  airline_cash: Record<string, number>;
};

export type Frame = {
  time: number;
  actions: Array<Record<string, string | number>>;
  agent_messages: Array<{ from: string; to: string; type: string; message: string }>;
  active_disruptions: Array<{ disruption_id: string; kind: string; target: string; message: string }>;
  reward: Reward;
  metrics: Metrics;
  observation: {
    clock: string;
    airports: Airport[];
    pending_decisions: PendingDecision[];
    network_summary: Metrics;
  };
};

export type Trace = {
  title: string;
  policy: string;
  stage: number;
  seed: number;
  summary: Metrics;
  total_reward: number;
  frames: Frame[];
};

export type TraceManifestRow = Metrics & {
  trace: string;
  policy: string;
  stage: number;
  total_reward: number;
};
