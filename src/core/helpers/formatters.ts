interface ReferenceItem {
  id: number | string;
  name?: string;
  full_name?: string;
}

interface ZamershikItem {
  id: number | string;
  full_name?: string;
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

/**
 * Formats numbers with thousand separators (1,234,567)
 * @param value - The number to format
 * @returns Formatted string with commas as thousand separators
 */
export function formatNumber(
  value: number | string | null | undefined,
): string {
  // Debug logging
  console.log("formatNumber called with:", value, "type:", typeof value);

  if (value === null || value === undefined || value === "") {
    return "0";
  }

  // Handle string numbers that might be "0.00" or similar
  let num: number;
  if (typeof value === "string") {
    num = parseFloat(value);
  } else {
    num = Number(value);
  }

  if (isNaN(num)) {
    return "0";
  }

  return num.toLocaleString("en-US");
}

/**
 * Formats a date string or Date object to a readable date and time format
 * @param value - The date string or Date object to format
 * @returns Formatted date and time string
 */
export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return "";

  try {
    const date = typeof value === "string" ? new Date(value) : value;
    if (isNaN(date.getTime())) return "";

    return date.toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}
