import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { CreateReceiptInput, Currency, Receipt } from "./types";
import { DEFAULT_CURRENCY } from "./currencies";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const DB_PATH = path.join(DATA_DIR, "receipts.db");

function ensureDirs() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function getDb() {
  ensureDirs();
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'HKD',
      category TEXT,
      merchant TEXT,
      date TEXT NOT NULL,
      notes TEXT,
      image_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  return db;
}

function rowToReceipt(row: Record<string, unknown>): Receipt {
  return {
    id: row.id as string,
    title: row.title as string,
    amount: row.amount as number,
    currency: row.currency as Currency,
    category: (row.category as string | null) ?? null,
    merchant: (row.merchant as string | null) ?? null,
    date: row.date as string,
    notes: (row.notes as string | null) ?? null,
    imagePath: row.image_path as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function getUploadsDir() {
  ensureDirs();
  return UPLOADS_DIR;
}

export function listReceipts(): Receipt[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM receipts ORDER BY date DESC, created_at DESC")
    .all();
  db.close();
  return rows.map((row) => rowToReceipt(row as Record<string, unknown>));
}

export function getReceipt(id: string): Receipt | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM receipts WHERE id = ?").get(id);
  db.close();
  if (!row) return null;
  return rowToReceipt(row as Record<string, unknown>);
}

export function createReceipt(
  input: CreateReceiptInput,
  imageFilename: string
): Receipt {
  const db = getDb();
  const now = new Date().toISOString();
  const id = uuidv4();

  db.prepare(
    `INSERT INTO receipts (id, title, amount, currency, category, merchant, date, notes, image_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.title,
    input.amount,
    input.currency ?? DEFAULT_CURRENCY,
    input.category ?? null,
    input.merchant ?? null,
    input.date,
    input.notes ?? null,
    imageFilename,
    now,
    now
  );

  db.close();
  const receipt = getReceipt(id);
  if (!receipt) throw new Error("Failed to create receipt");
  return receipt;
}

export function updateReceipt(
  id: string,
  input: Partial<CreateReceiptInput>
): Receipt | null {
  const existing = getReceipt(id);
  if (!existing) return null;

  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE receipts SET
      title = ?, amount = ?, currency = ?, category = ?, merchant = ?,
      date = ?, notes = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    input.title ?? existing.title,
    input.amount ?? existing.amount,
    input.currency ?? existing.currency,
    input.category !== undefined ? input.category : existing.category,
    input.merchant !== undefined ? input.merchant : existing.merchant,
    input.date ?? existing.date,
    input.notes !== undefined ? input.notes : existing.notes,
    now,
    id
  );

  db.close();
  return getReceipt(id);
}

export function deleteReceipt(id: string): boolean {
  const existing = getReceipt(id);
  if (!existing) return false;

  const imagePath = path.join(UPLOADS_DIR, existing.imagePath);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }

  const db = getDb();
  db.prepare("DELETE FROM receipts WHERE id = ?").run(id);
  db.close();
  return true;
}

export function getStats() {
  const receipts = listReceipts();
  const byCurrency: Record<string, number> = {};

  for (const r of receipts) {
    byCurrency[r.currency] = (byCurrency[r.currency] ?? 0) + r.amount;
  }

  return {
    totalCount: receipts.length,
    byCurrency,
    recent: receipts.slice(0, 5),
  };
}
