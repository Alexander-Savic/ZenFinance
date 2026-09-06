import * as XLSX from "xlsx";
import { parse as parseCsvSync } from "csv-parse/sync";

export interface ParsedRow {
  date: Date;
  amount: number;
  description: string;
  type: "INCOME" | "EXPENSE";
}

const DATE_KEYS = ["date", "transaction date", "posted date", "trans date"];
const AMOUNT_KEYS = ["amount", "transaction amount", "value"];
const DEBIT_KEYS = ["debit", "withdrawal"];
const CREDIT_KEYS = ["credit", "deposit"];
const DESC_KEYS = ["description", "memo", "details", "narrative", "payee"];

export function parseStatementFile(buffer: Buffer, filename: string): ParsedRow[] {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    return parseCsv(buffer);
  }
  if (ext === "xlsx" || ext === "xls") {
    return parseXlsx(buffer);
  }
  throw new Error("Unsupported file type. Upload .csv, .xls, or .xlsx");
}

function parseCsv(buffer: Buffer): ParsedRow[] {
  const records: Record<string, string>[] = parseCsvSync(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return normalizeRows(records);
}

function parseXlsx(buffer: Buffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    defval: "",
    raw: false,
  });
  return normalizeRows(records);
}

function normalizeRows(records: Record<string, any>[]): ParsedRow[] {
  if (!records.length) {
    throw new Error("File contains no rows");
  }

  const headerMap = buildHeaderMap(Object.keys(records[0]));
  const rows: ParsedRow[] = [];

  for (const record of records) {
    const rawDate = headerMap.date ? record[headerMap.date] : undefined;
    const rawDesc = headerMap.description ? record[headerMap.description] : undefined;

    const date = coerceDate(rawDate);
    const description = String(rawDesc ?? "").trim();
    if (!date || !description) continue;

    let amount: number | null = null;
    let type: "INCOME" | "EXPENSE" = "EXPENSE";

    if (headerMap.amount) {
      const raw = coerceNumber(record[headerMap.amount]);
      if (raw !== null) {
        amount = Math.abs(raw);
        type = raw < 0 ? "EXPENSE" : "INCOME";
      }
    } else if (headerMap.debit || headerMap.credit) {
      const debit = headerMap.debit ? coerceNumber(record[headerMap.debit]) : null;
      const credit = headerMap.credit ? coerceNumber(record[headerMap.credit]) : null;
      if (debit && debit > 0) {
        amount = Math.abs(debit);
        type = "EXPENSE";
      } else if (credit && credit > 0) {
        amount = Math.abs(credit);
        type = "INCOME";
      }
    }

    if (amount === null || Number.isNaN(amount)) continue;

    rows.push({ date, amount, description, type });
  }

  if (!rows.length) {
    throw new Error(
      "Could not extract any valid transactions. Check column headers (Date, Amount/Debit/Credit, Description)."
    );
  }

  return rows;
}

function buildHeaderMap(headers: string[]) {
  const lower = headers.map((h) => ({ original: h, normalized: h.trim().toLowerCase() }));
  const find = (candidates: string[]) =>
    lower.find((h) => candidates.includes(h.normalized))?.original;

  return {
    date: find(DATE_KEYS),
    amount: find(AMOUNT_KEYS),
    debit: find(DEBIT_KEYS),
    credit: find(CREDIT_KEYS),
    description: find(DESC_KEYS),
  };
}

function coerceDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const str = String(value).trim();
  const isoAttempt = new Date(str);
  if (!Number.isNaN(isoAttempt.getTime())) return isoAttempt;

  const parts = str.split(/[\/\-.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map((p) => parseInt(p, 10));
    const year = c > 31 ? c : a > 31 ? a : 2000 + c;
    const candidate = new Date(year, (b > 12 ? a : b) - 1, b > 12 ? b : a);
    if (!Number.isNaN(candidate.getTime())) return candidate;
  }
  return null;
}

function coerceNumber(value: any): number | null {
  if (value === undefined || value === null || value === "") return null;
  const cleaned = String(value).replace(/[,$\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? null : num;
}
