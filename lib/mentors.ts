
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

// Same category strings the route checks against — keep these two files in sync.
const CATEGORY_TO_MENTOR: Record<string, MentorId> = {
  STR: "gromgar",
  DEX: "gromgar",
  physical: "gromgar",
  INT: "eldor",
  "hard-skills": "eldor",
  CHA: "lirana",
  "soft-skills": "lirana",
  CRAFT: "eldor",
}


const DEFAULT_MENTOR = MENTORS.eldor

export function getMentor(category?: string): Mentor {
  if (!category) {
    console.warn("⚠️ [LifeMMO] Квест не має поля 'category'! Встановлено Елдора за замовчуванням.");
    return DEFAULT_MENTOR;
  }

  // Приводимо до нижнього регістру для безпечного порівняння
  const normalizedCategory = category.trim().toLowerCase();

  // Шукаємо співпадіння в ключах (теж привівши їх до нижнього регістру)
  const foundKey = Object.keys(CATEGORY_TO_MENTOR).find(
    (key) => key.toLowerCase() === normalizedCategory
  );

  if (foundKey) {
    return MENTORS[CATEGORY_TO_MENTOR[foundKey]];
  }

  console.warn(`⚠️ [LifeMMO] Невідома категорія квесту: "${category}". Встановлено Елдора.`);
  return DEFAULT_MENTOR;
}

