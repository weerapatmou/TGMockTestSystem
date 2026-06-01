// The group's topic catalog, grouped by category. This is the single source of
// truth used both by the DB seed (prisma/seed.ts) and by UI labels/ordering.

export const CATEGORIES = [
  "APPROXIMATION",
  "MEMORY",
  "NUMERICAL",
  "SCANNING",
  "SCIENCE",
  "SPATIAL",
] as const;

export type Category = (typeof CATEGORIES)[number];

/// Human-friendly label per category (kept English to match the group's wording).
export const CATEGORY_LABEL: Record<Category, string> = {
  APPROXIMATION: "Approximation",
  MEMORY: "Memory",
  NUMERICAL: "Numerical",
  SCANNING: "Scanning",
  SCIENCE: "Science",
  SPATIAL: "Spatial",
};

/// Accent color token per category (referenced in charts and chips).
export const CATEGORY_COLOR: Record<Category, string> = {
  APPROXIMATION: "var(--cat-approximation)",
  MEMORY: "var(--cat-memory)",
  NUMERICAL: "var(--cat-numerical)",
  SCANNING: "var(--cat-scanning)",
  SCIENCE: "var(--cat-science)",
  SPATIAL: "var(--cat-spatial)",
};

/// Every topic, in display order, with its category.
export const TOPIC_CATALOG: { name: string; category: Category }[] = [
  { name: "Series Number", category: "APPROXIMATION" },
  { name: "Series Picture", category: "APPROXIMATION" },

  { name: "Cube rotation", category: "MEMORY" },
  { name: "Aircraft rotation", category: "MEMORY" },
  { name: "Symbol Check", category: "MEMORY" },
  { name: "Mirror", category: "MEMORY" },

  { name: "Mechanical", category: "NUMERICAL" },

  { name: "Mathematic calc", category: "SCANNING" },
  { name: "Scanning Shape", category: "SCANNING" },
  { name: "STM (number) grid", category: "SCANNING" },
  { name: "STM (letter) grid", category: "SCANNING" },
  { name: "STM (picture) grid", category: "SCANNING" },
  { name: "STM (passage)", category: "SCANNING" },
  { name: "Scan cockpit", category: "SCANNING" },
  { name: "Radar alc", category: "SCANNING" },
  { name: "3D box", category: "SCANNING" },

  { name: "Approximation", category: "SCIENCE" },
  { name: "Natural Science", category: "SCIENCE" },

  { name: "Box folding", category: "SPATIAL" },
  { name: "Deviation check", category: "SPATIAL" },
  { name: "Spatial folding", category: "SPATIAL" },
  { name: "Jigsaw 2D", category: "SPATIAL" },
  { name: "Comparison", category: "SPATIAL" },
  { name: "Logic gate", category: "SPATIAL" },
  { name: "Electrical maze", category: "SPATIAL" },
  { name: "Hidden img", category: "SPATIAL" },
  { name: "Line scanning", category: "SPATIAL" },
  { name: "Key fitting", category: "SPATIAL" },
  { name: "Flip box", category: "SPATIAL" },
  { name: "Oblique view", category: "SPATIAL" },
  { name: "Rotate view", category: "SPATIAL" },
  { name: "Block counting", category: "SPATIAL" },
];
