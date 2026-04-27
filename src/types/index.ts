export type UserRole = "admin" | "user" | "data_entry";

export interface User {
  id: string;
  name: string;
  email: string;
  dni: string;
  role: UserRole;
  createdAt: string;
}

export interface RegisterData {
  name: string;
  email: string;
  dni: string;
  password: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamFlag: string;
  awayTeamFlag: string;
  group: string;
  phase?: string;
  scheduledDate: Date;
  resultDeadline: Date;
  homeScore?: number;
  awayScore?: number;
  isFinished: boolean;
}

export interface Prize {
  id: string;
  name: string;
  description: string;
  photoUrl?: string;
  criteria: "most_points_date" | "most_points_phase" | "most_points_tournament";
  assignmentType: "automatic" | "manual";
  tieResolution: "all" | "draw" | "first";
  phase?: string;
  createdAt: string;
  createdBy?: string;
}

export interface PrizeAssignment {
  id: string;
  prizeId: string;
  userId: string;
  userName?: string;
  assignmentDate: string;
  criteria: string;
  phase?: string;
  assignedBy?: string;
}

export interface RankingEntry {
  userId: string;
  userName: string;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
  position: number;
}

export interface NotificationMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  timestamp: Date;
}

export interface CompanyConfig {
  name: string;
  updatedAt?: string;
  updatedBy?: string;
}
