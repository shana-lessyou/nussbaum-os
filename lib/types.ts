export type Domain = "Capacera" | "Praxemy" | "LYMP" | "Personal";
export type BusinessDomain = "Capacera" | "Praxemy" | "LYMP";
export type Subdomain = "me" | "home" | "boys";
export type Swimlane = "today" | "this-week" | "backlog";
export type Method = "phys" | "phone" | "comp" | "hands-free";
export type TaskStatus = "open" | "done";
export type Category = "build" | "sell" | "admin";

export interface Task {
  id: string;
  user_id: string;
  domain: Domain;
  subdomain: Subdomain | string | null;
  title: string;
  notes: string | null;
  swimlane: Swimlane;
  points: number;
  method: Method;
  status: TaskStatus;
  position: number;
  category: Category | null;
  created_by: string;
  created_at: string;
  done_at: string | null;
  completion_notes: string | null;
}

export type EventType = "meal" | "purchase";
export type EventUnit = "kcal" | "USD" | "g";

export interface EventRow {
  id: string;
  user_id: string;
  date: string;
  type: EventType;
  entry: string;
  value: number;
  unit: EventUnit;
  logged_at: string;
  source: string;
}

export interface DailyRow {
  user_id: string;
  date: string;
  savers_silence: boolean;
  savers_affirmation: boolean;
  savers_visualization: boolean;
  savers_exercise: boolean;
  savers_read: boolean;
  savers_scribe: boolean;
  water: number;
  supplements: boolean;
  sleep_hrs: number | null;
  exercise: string | null;
  steps: number;
  resistance: boolean;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
  calories_total?: number;
  spending_total?: number;
}

export interface BusinessKpi {
  user_id: string;
  date: string;
  domain: BusinessDomain;
  customers: number;
  revenue: number;
  notes: string | null;
}

export type Scope = "day" | "week" | "month";

export interface CaptureResult {
  tasks: Array<{
    domain: Domain;
    subdomain?: Subdomain;
    title: string;
    points?: number;
    method?: Method;
    swimlane?: Swimlane;
    category?: Category;
  }>;
  events: Array<{
    type: EventType;
    entry: string;
    value: number;
    unit: EventUnit;
  }>;
  daily_updates: Partial<DailyRow>;
  macros_delta?: { protein_g?: number; carbs_g?: number; fat_g?: number };
}
