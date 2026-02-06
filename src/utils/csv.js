export function parseCsv(text) {
  const rows = [];
  let current = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      current.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      current.push(cell);
      if (current.some((value) => value.trim() !== '')) {
        rows.push(current);
      }
      current = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || current.length > 0) {
    current.push(cell);
    if (current.some((value) => value.trim() !== '')) {
      rows.push(current);
    }
  }

  return rows;
}

export function coerceValue(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (trimmed === '') return null;
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;

  const num = Number(trimmed.replace(/,/g, ''));
  if (!Number.isNaN(num) && trimmed.match(/^[-+]?\d+(\.\d+)?$/)) {
    return num;
  }

  return trimmed;
}

export function buildCsv(headers, rows = []) {
  const escapeCell = (cell) => {
    const text = cell ?? '';
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const headerRow = headers.join(',');
  const dataRows = rows.map((row) => headers.map((h) => escapeCell(row[h])).join(','));
  return [headerRow, ...dataRows].join('\n');
}
