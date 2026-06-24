export function handleSupabaseResult(result, fallbackMessage) {
  if (result.error) {
    throw new Error(result.error.message || fallbackMessage);
  }

  return result.data;
}

export function buildLikeQuery(query) {
  return `%${query.trim()}%`;
}
