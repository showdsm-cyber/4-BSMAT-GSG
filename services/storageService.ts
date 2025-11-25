import { Soldier, Exception, ServiceProfile, DailySchedule, GuardPoint, Specialty, RankDefinition, RoleDefinition, ScheduleStatus, User } from '../types';
import { MOCK_SOLDIERS, INITIAL_PROFILES, DEFAULT_GUARD_POINTS, DEFAULT_SPECIALTIES, DEFAULT_RANKS, DEFAULT_ROLES_CONFIG, DEFAULT_USERS } from '../constants';
import * as db from './db';

const KEYS = {
  PERSONNEL: 'personnel',
  EXCEPTIONS: 'exceptions',
  PROFILES: 'profiles',
  SCHEDULES: 'schedules',
  HOLIDAYS: 'holidays',
  GUARD_POINTS: 'guard_points',
  SPECIALTIES: 'specialties',
  RANKS: 'ranks',
  ROLES: 'roles',
  USERS: 'users'
};

// In-memory cache
const cache = {
  personnel: [] as Soldier[],
  exceptions: [] as Exception[],
  profiles: [] as ServiceProfile[],
  guardPoints: [] as GuardPoint[],
  specialties: [] as Specialty[],
  ranks: [] as RankDefinition[],
  roles: [] as RoleDefinition[],
  users: [] as User[],
  holidays: [] as string[],
  schedules: {} as Record<string, DailySchedule>,
  initialized: false
};

export const initializeStorage = async () => {
  if (cache.initialized) return;

  try {
    await db.initDB();

    // Load Settings / Blobs
    cache.personnel = await db.getSetting(KEYS.PERSONNEL) || MOCK_SOLDIERS;
    cache.exceptions = await db.getSetting(KEYS.EXCEPTIONS) || [];
    cache.profiles = await db.getSetting(KEYS.PROFILES) || INITIAL_PROFILES;
    cache.guardPoints = await db.getSetting(KEYS.GUARD_POINTS) || DEFAULT_GUARD_POINTS;
    cache.specialties = await db.getSetting(KEYS.SPECIALTIES) || DEFAULT_SPECIALTIES;
    cache.ranks = await db.getSetting(KEYS.RANKS) || DEFAULT_RANKS;
    cache.roles = await db.getSetting(KEYS.ROLES) || DEFAULT_ROLES_CONFIG;
    cache.users = await db.getSetting(KEYS.USERS) || DEFAULT_USERS;
    cache.holidays = await db.getSetting(KEYS.HOLIDAYS) || [];

    // Load Schedules (Separate Table)
    const schedulesList = await db.getAllItems('schedules');
    cache.schedules = schedulesList.reduce((acc, s) => ({ ...acc, [s.date]: s }), {});

    cache.initialized = true;
    console.log("Storage initialized from SQLite");
  } catch (e) {
    console.error("Failed to initialize storage from SQLite", e);
    // Fallback or empty?
    // If DB fails, we might be in a browser environment or broken state.
    // For now, we proceed with defaults in cache.
  }
};

// --- Users ---
export const getUsers = (): User[] => {
  return cache.users;
};

export const saveUsers = async (users: User[]) => {
  cache.users = users;
  await db.saveSetting(KEYS.USERS, users);
};

// --- Personnel ---
export const getPersonnel = (): Soldier[] => {
  return cache.personnel;
};

export const savePersonnel = async (personnel: Soldier[]) => {
  cache.personnel = personnel;
  await db.saveSetting(KEYS.PERSONNEL, personnel);
};

// --- Exceptions ---
export const getExceptions = (): Exception[] => {
  return cache.exceptions;
};

export const saveExceptions = async (exceptions: Exception[]) => {
  cache.exceptions = exceptions;
  await db.saveSetting(KEYS.EXCEPTIONS, exceptions);
};

// --- Profiles ---
export const getProfiles = (): ServiceProfile[] => {
  return cache.profiles;
};

export const saveProfiles = async (profiles: ServiceProfile[]) => {
  cache.profiles = profiles;
  await db.saveSetting(KEYS.PROFILES, profiles);
};

// --- Guard Points ---
export const getGuardPoints = (): GuardPoint[] => {
  return cache.guardPoints;
};

export const saveGuardPoints = async (points: GuardPoint[]) => {
  cache.guardPoints = points;
  await db.saveSetting(KEYS.GUARD_POINTS, points);
};

// --- Specialties ---
export const getSpecialties = (): Specialty[] => {
  return cache.specialties;
};

export const saveSpecialties = async (specialties: Specialty[]) => {
  cache.specialties = specialties;
  await db.saveSetting(KEYS.SPECIALTIES, specialties);
};

// --- Ranks ---
export const getRanks = (): RankDefinition[] => {
  return cache.ranks.sort((a, b) => a.order - b.order);
};

export const saveRanks = async (ranks: RankDefinition[]) => {
  cache.ranks = ranks;
  await db.saveSetting(KEYS.RANKS, ranks);
};

// --- Roles ---
export const getRoles = (): RoleDefinition[] => {
  return cache.roles;
};

export const saveRoles = async (roles: RoleDefinition[]) => {
  cache.roles = roles;
  await db.saveSetting(KEYS.ROLES, roles);
};

// --- Schedules ---
export const getSchedule = (date: string): DailySchedule | null => {
  const schedule = cache.schedules[date] || null;
  if (schedule && !schedule.status) {
    schedule.status = 'DRAFT';
  }
  return schedule;
};

export const getAllSchedules = (): Record<string, DailySchedule> => {
  return cache.schedules;
};

export const saveSchedule = async (schedule: DailySchedule) => {
  cache.schedules[schedule.date] = schedule;
  await db.saveItem('schedules', schedule.date, schedule, 'date');
};

export const setScheduleStatus = async (date: string, status: ScheduleStatus) => {
  if (cache.schedules[date]) {
    cache.schedules[date].status = status;
    await db.saveItem('schedules', date, cache.schedules[date], 'date');
  }
};

// --- Holidays ---
export const getHolidays = (): string[] => {
  return cache.holidays;
};

export const toggleHoliday = async (date: string) => {
  let list = cache.holidays;
  if (list.includes(date)) {
    list = list.filter(d => d !== date);
  } else {
    list.push(date);
  }
  cache.holidays = list;
  await db.saveSetting(KEYS.HOLIDAYS, list);
  return list;
};

// --- Backup & Restore ---
export const createBackup = (): string => {
  const backup: Record<string, any> = {
    [KEYS.PERSONNEL]: cache.personnel,
    [KEYS.EXCEPTIONS]: cache.exceptions,
    [KEYS.PROFILES]: cache.profiles,
    [KEYS.GUARD_POINTS]: cache.guardPoints,
    [KEYS.SPECIALTIES]: cache.specialties,
    [KEYS.RANKS]: cache.ranks,
    [KEYS.ROLES]: cache.roles,
    [KEYS.USERS]: cache.users,
    [KEYS.HOLIDAYS]: cache.holidays,
    [KEYS.SCHEDULES]: cache.schedules
  };
  return JSON.stringify(backup, null, 2);
};

export const restoreBackup = async (jsonString: string): Promise<boolean> => {
  try {
    const backup = JSON.parse(jsonString);
    if (!backup || typeof backup !== 'object') return false;

    if (backup[KEYS.PERSONNEL]) await savePersonnel(backup[KEYS.PERSONNEL]);
    if (backup[KEYS.EXCEPTIONS]) await saveExceptions(backup[KEYS.EXCEPTIONS]);
    if (backup[KEYS.PROFILES]) await saveProfiles(backup[KEYS.PROFILES]);
    if (backup[KEYS.GUARD_POINTS]) await saveGuardPoints(backup[KEYS.GUARD_POINTS]);
    if (backup[KEYS.SPECIALTIES]) await saveSpecialties(backup[KEYS.SPECIALTIES]);
    if (backup[KEYS.RANKS]) await saveRanks(backup[KEYS.RANKS]);
    if (backup[KEYS.ROLES]) await saveRoles(backup[KEYS.ROLES]);
    if (backup[KEYS.USERS]) await saveUsers(backup[KEYS.USERS]);
    if (backup[KEYS.HOLIDAYS]) {
      cache.holidays = backup[KEYS.HOLIDAYS];
      await db.saveSetting(KEYS.HOLIDAYS, backup[KEYS.HOLIDAYS]);
    }

    if (backup[KEYS.SCHEDULES]) {
      const schedules = backup[KEYS.SCHEDULES];
      for (const date in schedules) {
        await saveSchedule(schedules[date]);
      }
    }

    return true;
  } catch (e) {
    console.error("Failed to restore backup", e);
    return false;
  }
};
