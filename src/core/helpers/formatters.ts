interface ReferenceItem {
  id: number | string;
  name?: string;
  full_name?: string;
}

interface ZamershikItem {
  id: number | string;
  full_name: string;
}

interface DataWithResults {
  results: ReferenceItem[];
}

interface ZamershikDataWithResults {
  results: ZamershikItem[];
}

export function formatReferenceOptions(
  data: ReferenceItem[] | DataWithResults | undefined,
) {
  if (!data) return [];
  const items = Array.isArray(data) ? data : data.results;
  return items.map((item) => ({
    value: item.id,
    label: item.name || item.full_name || "",
  }));
}

export function formatZamershikOptions(
  data: ZamershikItem[] | ZamershikDataWithResults | undefined,
) {
  if (!data) return [];
  const items = Array.isArray(data) ? data : data.results;
  return items.map((item) => ({
    value: item.id,
    label: item.full_name,
  }));
}
