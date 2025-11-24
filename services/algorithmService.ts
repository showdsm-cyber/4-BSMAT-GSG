
import { getPersonnel, getExceptions, getProfiles, getHolidays, saveSchedule, getAllSchedules, getRoles } from './storageService';
import { DailySchedule, DayType, Soldier, Exception, RoleDefinition } from '../types';
import { SYSTEM_ROLES } from '../constants';
import { parseISO, isWeekend, isWithinInterval, subDays } from 'date-fns';

export const determineDayType = (dateStr: string): DayType => {
  const date = parseISO(dateStr);
  const holidays = getHolidays();
  
  if (holidays.includes(dateStr)) return DayType.Ferie;
  if (isWeekend(date)) return DayType.Weekend;
  return DayType.Semaine;
};

const isSoldierAvailable = (soldier: Soldier, dateStr: string, exceptions: Exception[]): boolean => {
  if (soldier.exempt) return false;
  
  const date = parseISO(dateStr);
  
  // Check exceptions
  for (const ex of exceptions) {
    if (ex.soldierId === soldier.id) {
        const start = parseISO(ex.startDate);
        const end = parseISO(ex.endDate);
        if (isWithinInterval(date, { start, end })) {
            return false;
        }
    }
  }
  return true;
};

const isInSchedule = (id: string, s: DailySchedule): boolean => {
    if (s.policeStation.chiefId === id || s.policeStation.deputyId === id) return true;
    if (s.permanence.officerId === id || s.permanence.ncoId === id) return true;
    if (s.specialists.some(spec => spec.soldierId === id)) return true;
    if (s.guardPoints.some(gp => gp.soldiers.includes(id))) return true;
    return false;
}

const findAvailable = (
  pool: Soldier[], 
  criteria: (s: Soldier) => boolean, 
  count: number,
  excludeIds: Set<string>,
  dateStr: string,
  lastDutyMap: Map<string, Date | null>,
  allSchedules: Record<string, DailySchedule>
): Soldier[] => {
  const yesterday = subDays(parseISO(dateStr), 1).toISOString().split('T')[0];
  const yesterdaySchedule = allSchedules[yesterday];

  // 1. Filter by basic criteria (rank, specialty, not excluded)
  let candidates = pool.filter(s => !excludeIds.has(s.id) && criteria(s));

  // 2. Strict Rule: REST (Must not have worked yesterday)
  if (yesterdaySchedule) {
      candidates = candidates.filter(s => !isInSchedule(s.id, yesterdaySchedule));
  }

  // 3. Sort by Equity (Last Duty Date)
  candidates.sort((a, b) => {
      const dateA = lastDutyMap.get(a.id);
      const dateB = lastDutyMap.get(b.id);

      if (!dateA && !dateB) return 0.5 - Math.random(); // Both never worked -> random mix
      if (!dateA) return -1; // A never worked -> A comes first
      if (!dateB) return 1; // B never worked -> B comes first
      
      return dateA.getTime() - dateB.getTime();
  });

  return candidates.slice(0, count);
};

export const generateDailySchedule = (dateStr: string): DailySchedule => {
  const dayType = determineDayType(dateStr);
  const profiles = getProfiles();
  const profile = profiles.find(p => p.dayType === dayType) || profiles[0];
  const personnel = getPersonnel();
  const exceptions = getExceptions();
  const allSchedules = getAllSchedules();
  
  // Load Role Configurations
  const roles = getRoles();
  const getRoleRanks = (roleId: string): string[] => {
      const role = roles.find(r => r.id === roleId);
      return role ? role.allowedRanks : [];
  };

  const policeChiefRanks = getRoleRanks(SYSTEM_ROLES.POLICE_CHIEF);
  const policeDeputyRanks = getRoleRanks(SYSTEM_ROLES.POLICE_DEPUTY);
  const permOfficerRanks = getRoleRanks(SYSTEM_ROLES.PERM_OFFICER);
  const permNcoRanks = getRoleRanks(SYSTEM_ROLES.PERM_NCO);
  const guardRanks = getRoleRanks(SYSTEM_ROLES.GUARD);

  // Pre-calculate last duty date for ALL personnel for performance
  const lastDutyMap = new Map<string, Date | null>();
  const sortedPastDates = Object.keys(allSchedules)
    .filter(d => d < dateStr)
    .sort((a, b) => b.localeCompare(a)); 

  personnel.forEach(p => {
    let lastDate: Date | null = null;
    for (const d of sortedPastDates) {
        if (isInSchedule(p.id, allSchedules[d])) {
            lastDate = parseISO(d);
            break; 
        }
    }
    lastDutyMap.set(p.id, lastDate);
  });

  const availablePersonnel = personnel.filter(p => isSoldierAvailable(p, dateStr, exceptions));
  
  const usedIds = new Set<string>();
  const schedule: DailySchedule = {
    date: dateStr,
    dayType,
    status: 'DRAFT', // Default status for new generation
    policeStation: { chiefId: null, deputyId: null },
    permanence: { officerId: null, ncoId: null },
    specialists: [],
    guardPoints: []
  };

  const select = (criteria: (s: Soldier) => boolean, count: number) => {
      return findAvailable(availablePersonnel, criteria, count, usedIds, dateStr, lastDutyMap, allSchedules);
  }

  // 1. Assign Permanence (High Priority)
  const officerPerm = select(s => permOfficerRanks.includes(s.rank), 1);
  if (officerPerm.length) {
    schedule.permanence.officerId = officerPerm[0].id;
    usedIds.add(officerPerm[0].id);
  }

  const ncoPerm = select(s => permNcoRanks.includes(s.rank), 1);
  if (ncoPerm.length) {
    schedule.permanence.ncoId = ncoPerm[0].id;
    usedIds.add(ncoPerm[0].id);
  }

  // 2. Assign Police Station
  const chief = select(s => policeChiefRanks.includes(s.rank), 1);
  if (chief.length) {
    schedule.policeStation.chiefId = chief[0].id;
    usedIds.add(chief[0].id);
  }

  const deputy = select(s => policeDeputyRanks.includes(s.rank), 1);
  if (deputy.length) {
    schedule.policeStation.deputyId = deputy[0].id;
    usedIds.add(deputy[0].id);
  }

  // 3. Specialists
  profile.requiredSpecialists.forEach(req => {
    if (req.count > 0) {
        // Specialists don't strictly check rank, but assume competency
        // However, we should filter out those who are too high rank?
        // For now, allow any rank if they have the specialty.
        const specs = select(s => s.specialties.includes(req.specialty), req.count);
        specs.forEach(s => {
            schedule.specialists.push({ specialty: req.specialty, soldierId: s.id });
            usedIds.add(s.id);
        });
    }
  });

  // 4. Guard Points
  let activePoints: number[] = [];
  if (profile.activePointIds && profile.activePointIds.length > 0) {
    activePoints = profile.activePointIds;
  } else {
    activePoints = Array.from({length: profile.activeGuardPoints}, (_, i) => i + 1);
  }

  for (const pointId of activePoints) {
    // Guards must match the "GUARD" role criteria
    const guards = select(s => 
      !s.medicalRestriction && guardRanks.includes(s.rank), 3);
    
    if (guards.length > 0) {
      schedule.guardPoints.push({
        pointId: pointId,
        soldiers: guards.map(g => g.id)
      });
      guards.forEach(g => usedIds.add(g.id));
    }
  }

  saveSchedule(schedule);
  return schedule;
};
