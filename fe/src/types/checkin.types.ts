// ─── Member embed (populated from CheckinLog) ────────────────────────────────
export interface CheckinMemberPopulated {
  _id:      string;
  memberId: string;
  fullName: string;
  phone:    string;
  status:   string;
}

// ─── RecordedBy embed ─────────────────────────────────────────────────────────
export interface CheckinRecordedByPopulated {
  _id:  string;
  name: string;
}

// ─── Frontend model ───────────────────────────────────────────────────────────
export interface CheckinLog {
  id:          string;
  member:      CheckinMemberPopulated | null;
  checkinAt:   string;
  note?:       string;
  recordedBy:  CheckinRecordedByPopulated | null;
  // Computed
  checkinAtLabel:  string;   // "22/05/2026 08:30"
  checkinDateOnly: string;   // "22/05/2026"
  checkinTimeOnly: string;   // "08:30"
  memberName:      string;
  recordedByName:  string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export interface CheckinStats {
  todayCount:  number;
  weekCount:   number;
  monthCount:  number;
  peakHour:    number | null;   // 0-23
  dailyTrend:  { date: string; count: number }[];
}

// ─── API raw ──────────────────────────────────────────────────────────────────
export interface CheckinLogApiData {
  _id:        string;
  member:     CheckinMemberPopulated | null;
  checkinAt:  string;
  note?:      string;
  recordedBy: CheckinRecordedByPopulated | null;
}

export interface CheckinListApiResponse {
  success: boolean;
  count:   number;
  data:    CheckinLogApiData[];
}

export interface CheckinApiResponse {
  success: boolean;
  data:    CheckinLogApiData;
}

export interface CheckinStatsApiResponse {
  success: boolean;
  data:    CheckinStats;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────
export interface RecordCheckinPayload {
  memberId: string;
  note?:    string;
}

// ─── Query params ─────────────────────────────────────────────────────────────
export interface CheckinQueryParams {
  memberId?:  string;
  date?:      string;   // "YYYY-MM-DD" — exact day
  dateFrom?:  string;   // "YYYY-MM-DD"
  dateTo?:    string;   // "YYYY-MM-DD"
}

// ─── Store ────────────────────────────────────────────────────────────────────
export interface CheckinState {
  logs:      CheckinLog[];
  stats:     CheckinStats | null;
  isLoading: boolean;
  error:     string | null;

  fetchLogs:       (params?: CheckinQueryParams) => Promise<void>;
  fetchStats:      ()                             => Promise<void>;
  recordCheckin:   (payload: RecordCheckinPayload) => Promise<CheckinLog>;
  clearError:      () => void;
}
