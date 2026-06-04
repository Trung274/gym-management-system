// ─── Section types ────────────────────────────────────────────────────────────
export interface DashboardMembers {
  total:        number;
  active:       number;
  suspended:    number;
  newThisMonth: number;
}

export interface DashboardTrainers {
  total:  number;
  active: number;
}

export interface DashboardBookings {
  total:               number;
  pending:             number;
  confirmed:           number;
  completedThisMonth:  number;
}

export interface DashboardCheckins {
  today:    number;
  thisWeek: number;
}

export interface TodayScheduleItem {
  name:     string;
  location: string;
  sessions: { dayOfWeek: number; startTime: string; endTime: string }[];
}

export interface DashboardClasses {
  total:         number;
  active:        number;
  todaySchedule: TodayScheduleItem[];
}

export interface DashboardEquipment {
  total:       number;
  operational: number;
  maintenance: number;
  outOfOrder:  number;
}

export interface DashboardPlans {
  total:  number;
  active: number;
}

// ─── Full snapshot ─────────────────────────────────────────────────────────────
export interface DashboardSnapshot {
  members:   DashboardMembers;
  trainers:  DashboardTrainers;
  bookings:  DashboardBookings;
  checkins:  DashboardCheckins;
  classes:   DashboardClasses;
  equipment: DashboardEquipment;
  plans:     DashboardPlans;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface DashboardApiResponse {
  success:     boolean;
  generatedAt: string;
  data:        DashboardSnapshot;
}
