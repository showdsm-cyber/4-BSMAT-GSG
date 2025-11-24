
import { Soldier, ServiceProfile, DayType, GuardPoint, RankDefinition, RoleDefinition, User } from './types';

// Generators for the requested data
const FIRST_NAMES = [
  "Hicham", "Mohamed", "Youssef", "Karim", "Bilal", "Rachid", "Said", "Omar", 
  "Mehdi", "Farid", "Ahmed", "Ali", "Hassan", "Nabil", "Tarik", "Khalid", 
  "Mustapha", "Yassine", "Samir", "Amine", "Jamal", "Brahim", "Ismail", 
  "Hamza", "Walid", "Reda", "Anis", "Sofiane", "Hakim", "Mourad", "Nasser"
];

const LAST_NAMES = [
  "Malit", "Bennani", "Alami", "Idrissi", "Tazi", "Mansouri", "Ziani", 
  "Touati", "Chaoui", "Fassi", "Jebbar", "Hakimi", "Daoudi", "Moussaoui", 
  "Rahmani", "Salhi", "Ghazouani", "Benali", "Ait", "Bouzid", "Kabbaj", 
  "Naciri", "Ouazzani", "Tahiri", "El Amrani", "Berrada", "Chraibi", 
  "El Fassi", "Sefrioui", "Benjelloun", "Lazrak"
];

export const DEFAULT_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    password: '5607', // Password updated as requested
    displayName: 'Administrateur',
    role: 'ADMIN'
  },
  {
    id: '2',
    username: 'gestion',
    password: 'user123',
    displayName: 'Gestionnaire RH',
    role: 'MANAGER'
  }
];

export const DEFAULT_SPECIALTIES = [
  "Conducteur",
  "Infirmier",
  "Mécanicien",
  "Dépannage",
  "Transmissions"
];

export const SYSTEM_ROLES = {
  POLICE_CHIEF: 'police_chief',
  POLICE_DEPUTY: 'police_deputy',
  PERM_OFFICER: 'perm_officer',
  PERM_NCO: 'perm_nco',
  GUARD: 'guard'
};

export const DEFAULT_RANKS: RankDefinition[] = [
  { id: "Soldat", label: "Soldat", order: 10 },
  { id: "Caporal", label: "Caporal", order: 20 },
  { id: "Caporal-Chef", label: "Caporal-Chef", order: 30 },
  { id: "Sergent", label: "Sergent", order: 40 },
  { id: "Sergent-Chef", label: "Sergent-Chef", order: 50 },
  { id: "Adjudant", label: "Adjudant", order: 60 },
  { id: "Adjudant-Chef", label: "Adjudant-Chef", order: 70 },
  { id: "Lieutenant", label: "Lieutenant", order: 80 },
  { id: "Capitaine", label: "Capitaine", order: 90 }
];

// Configuration STRICTE selon Section 4.3.3 du cahier des charges
export const DEFAULT_ROLES_CONFIG: RoleDefinition[] = [
  { 
    id: SYSTEM_ROLES.POLICE_CHIEF, 
    name: "Chef de Poste", 
    // Section 2.1: Chef poste police = sergent-chef
    // Section 4.3.3: Sergent-chef -> CHEF_POSTE_POLICE
    allowedRanks: ["Sergent-Chef", "Adjudant"] 
  },
  { 
    id: SYSTEM_ROLES.POLICE_DEPUTY, 
    name: "Adjoint Poste", 
    // Section 2.1: Adjoint chef poste police = sergent
    // Section 4.3.3: Sergent -> ADJ_POSTE_POLICE
    // On autorise Sergent-Chef en fallback ou renfort
    allowedRanks: ["Sergent", "Sergent-Chef"] 
  },
  { 
    id: SYSTEM_ROLES.PERM_OFFICER, 
    name: "Officier Permanence", 
    // Section 2.3: Officier ou Sous-Officier de permanence
    // Section 4.3.3: Officiers -> OFF_PERM
    allowedRanks: ["Lieutenant", "Capitaine"] 
  },
  { 
    id: SYSTEM_ROLES.PERM_NCO, 
    name: "Adjoint Permanence", 
    // Section 2.3: Adjoint de permanence = obligatoirement adjudant ou adjudant-chef
    allowedRanks: ["Adjudant", "Adjudant-Chef"] 
  },
  { 
    id: SYSTEM_ROLES.GUARD, 
    name: "Garde / Sentinelle", 
    // Section 2.2: Chaque point est occupé par 3 soldats
    // Section 4.3.3: Soldat / Caporal -> GARDE_POINT
    // Section 4.3.3: Sergent -> GARDE_POINT (aussi possible selon règles)
    allowedRanks: ["Soldat", "Caporal", "Caporal-Chef", "Sergent"] 
  }
];

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateSoldier = (id: number, rank: string, forcedSpecialties: string[] = []): Soldier => {
  const hasMedical = Math.random() < 0.05; // 5% chance of medical restriction
  const isExempt = Math.random() < 0.02; // 2% chance of exemption
  
  let specialties = [...forcedSpecialties];
  
  // Randomly assign specialties if none forced, based on probability
  if (specialties.length === 0 && Math.random() > 0.6) {
    specialties.push(getRandom(DEFAULT_SPECIALTIES));
  }

  return {
    id: id.toString(),
    firstName: getRandom(FIRST_NAMES),
    lastName: getRandom(LAST_NAMES),
    rank: rank,
    specialties: specialties,
    medicalRestriction: hasMedical,
    exempt: isExempt
  };
};

const generateUnit = (): Soldier[] => {
  let soldiers: Soldier[] = [];
  let idCounter = 1;

  // --- 12 Officiers ---
  // 3 Capitaines
  for (let i = 0; i < 3; i++) soldiers.push(generateSoldier(idCounter++, "Capitaine"));
  // 9 Lieutenants
  for (let i = 0; i < 9; i++) soldiers.push(generateSoldier(idCounter++, "Lieutenant"));

  // --- 25 Sous-Officiers ---
  // 5 Adjudant-Chefs
  for (let i = 0; i < 5; i++) soldiers.push(generateSoldier(idCounter++, "Adjudant-Chef"));
  // 6 Adjudants (Key for Adjoint Permanence)
  for (let i = 0; i < 6; i++) soldiers.push(generateSoldier(idCounter++, "Adjudant"));
  // 7 Sergent-Chefs (Key for Chef de Poste)
  for (let i = 0; i < 7; i++) soldiers.push(generateSoldier(idCounter++, "Sergent-Chef"));
  // 7 Sergents (Key for Adjoint Poste)
  for (let i = 0; i < 7; i++) soldiers.push(generateSoldier(idCounter++, "Sergent"));

  // --- 85 Militaires du rang (Soldats/Caporaux) ---
  // 15 Caporal-Chefs
  for (let i = 0; i < 15; i++) soldiers.push(generateSoldier(idCounter++, "Caporal-Chef"));
  // 30 Caporaux (Example: Cal Hicham Malit)
  for (let i = 0; i < 30; i++) soldiers.push(generateSoldier(idCounter++, "Caporal"));
  // 40 Soldats
  for (let i = 0; i < 40; i++) soldiers.push(generateSoldier(idCounter++, "Soldat"));

  // Ensure we have enough critical specialists for the algorithms to work
  // Assign Conductors (Drivers)
  for (let i = 50; i < 65; i++) { 
     if (!soldiers[i].specialties.includes("Conducteur")) {
         soldiers[i].specialties.push("Conducteur");
     }
  }
  // Assign Nurses (Infirmiers)
  for (let i = 65; i < 72; i++) {
    soldiers[i].specialties = ["Infirmier"];
  }
  // Assign Mechanics
  for (let i = 72; i < 80; i++) {
    soldiers[i].specialties = ["Mécanicien"];
  }

  return soldiers;
};

export const MOCK_SOLDIERS: Soldier[] = generateUnit();

export const DEFAULT_GUARD_POINTS: GuardPoint[] = [
  { id: 1, name: "Entrée Principale", location: "Zone Nord" },
  { id: 2, name: "Dépôt Munitions", location: "Zone Sud (Sécurisée)" },
  { id: 3, name: "Parc Véhicules", location: "Zone Technique" },
  { id: 4, name: "Soute à Carburant", location: "Zone Est" },
];

export const INITIAL_PROFILES: ServiceProfile[] = [
  {
    id: 'p_week',
    dayType: DayType.Semaine,
    activeGuardPoints: 3,
    activePointIds: [1, 2, 3],
    requiredSpecialists: [
      { specialty: "Conducteur", count: 1 },
      { specialty: "Infirmier", count: 1 },
      { specialty: "Mécanicien", count: 1 },
      { specialty: "Dépannage", count: 1 },
    ]
  },
  {
    id: 'p_weekend',
    dayType: DayType.Weekend,
    activeGuardPoints: 2, 
    activePointIds: [1, 2],
    requiredSpecialists: [
      { specialty: "Conducteur", count: 1 },
      { specialty: "Infirmier", count: 1 }, 
    ]
  },
  {
    id: 'p_holiday',
    dayType: DayType.Ferie,
    activeGuardPoints: 2,
    activePointIds: [1, 2],
    requiredSpecialists: [
      { specialty: "Conducteur", count: 1 },
      { specialty: "Infirmier", count: 1 },
    ]
  }
];

export const ROTATION_HOURS = [
  "08:00", "10:00", "12:00", "14:00", "16:00", "18:00",
  "20:00", "22:00", "00:00", "02:00", "04:00", "06:00"
];
