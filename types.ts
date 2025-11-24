
export type Rank = string;

// Changed from Enum to string to allow dynamic user creation
export type Specialty = string;

export enum ExceptionType {
  Maladie = "Maladie",
  Conge = "Congé/Permission",
  Mission = "Mission",
  Detachement = "Détachement",
  RaisonService = "Raison de Service"
}

export enum DayType {
  Semaine = "SEMAINE",
  Weekend = "WEEK_END",
  Ferie = "FERIE"
}

export type ScheduleStatus = 'DRAFT' | 'VALIDATED';

export type UserRole = 'ADMIN' | 'MANAGER';

export interface User {
  id: string;
  username: string;
  password?: string; // Only used for verifying, not stored in plain text in a real app (but mocked here)
  displayName: string;
  role: UserRole;
}

export interface RankDefinition {
  id: string;     // The unique identifier (e.g., "Sergent")
  label: string;  // Display name
  order: number;  // For sorting hierarchy (1 = lowest)
}

export interface RoleDefinition {
  id: string;        // System key (e.g., "police_chief")
  name: string;      // Display name (e.g., "Chef de Poste")
  allowedRanks: string[]; // List of Rank IDs allowed for this role
}

export interface Soldier {
  id: string;
  firstName: string;
  lastName: string;
  rank: Rank; // Now a string referencing RankDefinition.id
  specialties: Specialty[];
  medicalRestriction: boolean; // True if partial restriction
  exempt: boolean; // True if fully exempt permanently
}

export interface Exception {
  id: string;
  soldierId: string;
  type: ExceptionType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  comment?: string;
}

export interface GuardPoint {
  id: number;
  name: string;
  location?: string;
}

// Configuration Profiles
export interface ServiceProfile {
  id: string;
  dayType: DayType;
  activeGuardPoints: number; // Deprecated but kept for backward compatibility
  activePointIds?: number[]; // List of specific active GuardPoint IDs
  requiredSpecialists: {
    specialty: Specialty;
    count: number;
  }[];
}

// The daily schedule result
export interface DailySchedule {
  date: string; // YYYY-MM-DD
  dayType: DayType;
  status: ScheduleStatus; // New field for validation workflow
  policeStation: {
    chiefId: string | null;
    deputyId: string | null;
  };
  permanence: {
    officerId: string | null;
    ncoId: string | null;
  };
  specialists: {
    specialty: Specialty;
    soldierId: string;
  }[];
  guardPoints: {
    pointId: number;
    soldiers: string[]; // Array of 3 soldier IDs
  }[];
}

export interface Rotation {
  startTime: string; // HH:00
  soldierId: string;
}
