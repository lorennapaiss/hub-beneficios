const LEADERSHIP_KEYWORDS = [
  "gerente",
  "gestor",
  "gestora",
  "coordenador",
  "coordenadora",
  "diretor",
  "diretora",
  "supervisor",
  "supervisora",
  "lider",
  "head",
  "vice-presidente",
  "presidente",
  "chefe",
  "ceo",
  "cfo",
  "cto",
  "coo",
  "cmo",
  "cpo",
  "manager",
  "gerencia",
  "lideranca",
];

export function classifyRole(role: string): "Liderança" | "Base" {
  const normalized = role
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return LEADERSHIP_KEYWORDS.some((kw) => normalized.includes(kw))
    ? "Liderança"
    : "Base";
}

export const ROLE_GROUPS = ["Liderança", "Base"] as const;
