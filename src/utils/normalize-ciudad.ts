/** Normaliza ciudad/zona: trim, espacios simples, capitalización por palabra. */
export function normalizeCiudad(
  value: string | null | undefined,
): string | null {
  if (value == null || typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map(
          (part) =>
            part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join("-"),
    )
    .join(" ");
}
