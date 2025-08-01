export function formatReferenceOptions(data: any[] | { results: any[] } | undefined) {
  if (!data) return [];
  const items = Array.isArray(data) ? data : data.results;
  return items.map(item => ({
    value: item.id,
    label: item.name,
  }));
}
