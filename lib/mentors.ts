// Mentor persona resolved automatically from a quest's category/stat.
// Mirrors the persona logic in app/api/chat/route.ts exactly, so the
// portrait shown here always matches which system prompt actually answers.
//
// ⚠️ ADJUST ME: drop the 3 real PNGs into /public/mentors/ with these names
// (or change the avatar paths below to match your files).

export type MentorId = "gromgar" | "eldor" | "lirana"

export type Mentor = {
  id: MentorId
  name: string
  title: string
  avatar: string
  accent: "streak" | "primary" | "chart-5"
}

const MENTORS: Record<MentorId, Mentor> = {
  gromgar: { id: "gromgar", name: "Громгар", title: "Огр-Воїн", avatar: "/mentors/gromgar.png", accent: "streak" },
  eldor: { id: "eldor", name: "Елдор", title: "Мудрий Маг", avatar: "/mentors/eldor.png", accent: "primary" },
  lirana: { id: "lirana", name: "Лірана", title: "Ельфійка", avatar: "/mentors/lirana.png", accent: "chart-5" },
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

// route.ts falls back to a generic, un-costumed "Ігровий Майстер" voice for any
// unrecognized category string, but with only STR/DEX/INT/CHA in play, every
// real quest should already resolve to one of the 3 mentors above.
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

