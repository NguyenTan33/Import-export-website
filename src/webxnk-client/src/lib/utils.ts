export interface Translatable {
  languageCode?: string | null;
}

/** Returns the best available translation without assuming the API supplied an array. */
export function getTranslation<T extends Translatable>(
  translations: readonly T[] | null | undefined,
  languageCode: string,
): T | undefined {
  const available = Array.isArray(translations) ? translations : [];
  return (
    available.find((translation) => translation?.languageCode === languageCode) ??
    available.find((translation) => translation?.languageCode === "vi") ??
    available[0]
  );
}

/** Reads a record code from common backend field names, including ApiResponse.data. */
export function getRecordCode(
  value: unknown,
  fields: readonly string[],
): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  for (const field of fields) {
    const candidate = record[field];
    if (typeof candidate === "string" && candidate.trim()) return candidate;
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }

  return getRecordCode(record.data, fields);
}
