
import { Soldier, Exception, ServiceProfile, DailySchedule, GuardPoint, Specialty, RankDefinition, RoleDefinition, ScheduleStatus, User } from '../types';
import { MOCK_SOLDIERS, INITIAL_PROFILES, DEFAULT_GUARD_POINTS, DEFAULT_SPECIALTIES, DEFAULT_RANKS, DEFAULT_ROLES_CONFIG, DEFAULT_USERS } from '../constants';

const KEYS = {
  PERSONNEL: 'sm_personnel',
  EXCEPTIONS: 'sm_exceptions',
  PROFILES: 'sm_profiles',
  SCHEDULES: 'sm_schedules',
  HOLIDAYS: 'sm_holidays', // List of date strings YYYY-MM-DD
  GUARD_POINTS: 'sm_guard_points',
  SPECIALTIES: 'sm_specialties',
  RANKS: 'sm_ranks',
  ROLES: 'sm_roles',
  USERS: 'sm_users'
};

// --- Users ---
export const getUsers = (): User[] => {
  const data = localStorage.getItem(KEYS.USERS);
  if (!data) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  return JSON.parse(data);
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

// --- Personnel ---
export const getPersonnel = (): Soldier[] => {
  const data = localStorage.getItem(KEYS.PERSONNEL);
  if (!data) {
    localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(MOCK_SOLDIERS));
    return MOCK_SOLDIERS;
  }
  return JSON.parse(data);
};

export const savePersonnel = (personnel: Soldier[]) => {
  localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(personnel));
};

// --- Exceptions ---
export const getExceptions = (): Exception[] => {
  const data = localStorage.getItem(KEYS.EXCEPTIONS);
  return data ? JSON.parse(data) : [];
};

export const saveExceptions = (exceptions: Exception[]) => {
  localStorage.setItem(KEYS.EXCEPTIONS, JSON.stringify(exceptions));
};

// --- Profiles ---
export const getProfiles = (): ServiceProfile[] => {
  const data = localStorage.getItem(KEYS.PROFILES);
  if (!data) {
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
    return INITIAL_PROFILES;
  }
  return JSON.parse(data);
};

export const saveProfiles = (profiles: ServiceProfile[]) => {
  localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
};

// --- Guard Points ---
export const getGuardPoints = (): GuardPoint[] => {
  const data = localStorage.getItem(KEYS.GUARD_POINTS);
  if (!data) {
    localStorage.setItem(KEYS.GUARD_POINTS, JSON.stringify(DEFAULT_GUARD_POINTS));
    return DEFAULT_GUARD_POINTS;
  }
  return JSON.parse(data);
};

export const saveGuardPoints = (points: GuardPoint[]) => {
  localStorage.setItem(KEYS.GUARD_POINTS, JSON.stringify(points));
};

// --- Specialties ---
export const getSpecialties = (): Specialty[] => {
  const data = localStorage.getItem(KEYS.SPECIALTIES);
  if (!data) {
    localStorage.setItem(KEYS.SPECIALTIES, JSON.stringify(DEFAULT_SPECIALTIES));
    return DEFAULT_SPECIALTIES;
  }
  return JSON.parse(data);
};

export const saveSpecialties = (specialties: Specialty[]) => {
  localStorage.setItem(KEYS.SPECIALTIES, JSON.stringify(specialties));
};

// --- Ranks ---
export const getRanks = (): RankDefinition[] => {
  const data = localStorage.getItem(KEYS.RANKS);
  if (!data) {
    localStorage.setItem(KEYS.RANKS, JSON.stringify(DEFAULT_RANKS));
    return DEFAULT_RANKS;
  }
  return JSON.parse(data).sort((a: RankDefinition, b: RankDefinition) => a.order - b.order);
};

export const saveRanks = (ranks: RankDefinition[]) => {
  localStorage.setItem(KEYS.RANKS, JSON.stringify(ranks));
};

// --- Roles ---
export const getRoles = (): RoleDefinition[] => {
  const data = localStorage.getItem(KEYS.ROLES);
  if (!data) {
    localStorage.setItem(KEYS.ROLES, JSON.stringify(DEFAULT_ROLES_CONFIG));
    return DEFAULT_ROLES_CONFIG;
  }
  return JSON.parse(data);
};

export const saveRoles = (roles: RoleDefinition[]) => {
  localStorage.setItem(KEYS.ROLES, JSON.stringify(roles));
};

// --- Schedules ---
export const getSchedule = (date: string): DailySchedule | null => {
  const all = JSON.parse(localStorage.getItem(KEYS.SCHEDULES) || '{}');
  const schedule = all[date] || null;
  // Backward compatibility: If status missing, assume DRAFT
  if (schedule && !schedule.status) {
      schedule.status = 'DRAFT';
  }
  return schedule;
};

export const getAllSchedules = (): Record<string, DailySchedule> => {
  return JSON.parse(localStorage.getItem(KEYS.SCHEDULES) || '{}');
};

export const saveSchedule = (schedule: DailySchedule) => {
  const all = JSON.parse(localStorage.getItem(KEYS.SCHEDULES) || '{}');
  all[schedule.date] = schedule;
  localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(all));
};

export const setScheduleStatus = (date: string, status: ScheduleStatus) => {
    const all = JSON.parse(localStorage.getItem(KEYS.SCHEDULES) || '{}');
    if (all[date]) {
        all[date].status = status;
        localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(all));
    }
};

// --- Holidays ---
export const getHolidays = (): string[] => {
  return JSON.parse(localStorage.getItem(KEYS.HOLIDAYS) || '[]');
};

export const toggleHoliday = (date: string) => {
  let list = getHolidays();
  if (list.includes(date)) {
    list = list.filter(d => d !== date);
  } else {
    list.push(date);
  }
  localStorage.setItem(KEYS.HOLIDAYS, JSON.stringify(list));
  return list;
};

// --- Backup & Restore ---
export const createBackup = (): string => {
  const backup: Record<string, any> = {};
  Object.values(KEYS).forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        backup[key] = JSON.parse(data);
      } catch (e) {
        console.warn(`Failed to parse key ${key} for backup`, e);
      }
    }
  });
  return JSON.stringify(backup, null, 2);
};

export const restoreBackup = (jsonString: string): boolean => {
  try {
    const backup = JSON.parse(jsonString);
    if (!backup || typeof backup !== 'object') return false;

    // Iterate over known keys to prevent injecting garbage
    Object.values(KEYS).forEach(key => {
      if (backup[key]) {
        localStorage.setItem(key, JSON.stringify(backup[key]));
      }
    });
    return true;
  } catch (e) {
    console.error("Failed to restore backup", e);
    return false;
  }
};
