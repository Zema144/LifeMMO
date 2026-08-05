export type MentorId = "gromgar" | "eldor" | "lirana"

export type Mentor = {
  id: MentorId
  name: string
  title: string
  avatar: string
  accent: "streak" | "primary" | "chart-5"
}

const MENTORS: Record<MentorId, Mentor> = {
  gromgar: { id: "gromgar", name: "Gromgar", title: "Warrior Ogr", avatar: "/mentors/gromgar.png", accent: "streak" },
  eldor: { id: "eldor", name: "Eldor", title: "Mystery Wizard", avatar: "/mentors/eldor.png", accent: "primary" },
  lirana: { id: "lirana", name: "Lirana", title: "Elf Princess", avatar: "/mentors/lirana.png", accent: "chart-5" },
}

// Додали всі npcRole та primaryStat з нашої бази даних
const CATEGORY_TO_MENTOR: Record<string, MentorId> = {
  // За статами (primaryStat)
  STR: "gromgar",
  DEX: "gromgar",
  INT: "eldor",
  CHA: "lirana",
  CRAFT: "eldor",

  // Старі категорії
  physical: "gromgar",
  "hard-skills": "eldor",
  "soft-skills": "lirana",

  WARRIOR: "gromgar",
  WIZARD: "eldor",
  ELF: "lirana",
  MERCHANT: "lirana", // Фінанси (Харизма)
  BARD: "lirana",     // Музика (Харизма)
}

const DEFAULT_MENTOR = MENTORS.eldor

export function getMentor(category?: string): Mentor {
  if (!category) return MENTORS.eldor;

  const cat = category.trim().toUpperCase();

  // Громгар (Воїни, Фітнес)
  if (cat === "WARRIOR" || cat === "STR" || cat === "DEX" || cat === "PHYSICAL") return MENTORS.gromgar;
  
  // Лірана (Ельфи, Кулінарія, Мови)
  if (cat === "ELF" || cat === "CHA" || cat === "SOFT-SKILLS") return MENTORS.lirana;
  
  // Елдор (Маги, Програмування)
  if (cat === "WIZARD" || cat === "INT" || cat === "CRAFT" || cat === "HARD-SKILLS") return MENTORS.eldor;

  return MENTORS.eldor;
}