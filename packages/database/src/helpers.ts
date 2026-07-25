import db from './index.js';

export function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params);
  stmt.free();
  return rows;
}

export function queryOne(sql: string, params: any[] = []): any | undefined {
  const stmt = db.prepare(sql);
  const row = stmt.get(...params);
  stmt.free();
  return row;
}

export function execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  stmt.free();
  return result;
}

export function exec(sql: string): void {
  db.exec(sql);
}

export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export function now(): string {
  return new Date().toISOString();
}

export function orderNo(): string {
  return `ORD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function parseJson(val: string, def: any = null): any {
  try { return JSON.parse(val); } catch { return def; }
}

export function toJson(val: any): string {
  return JSON.stringify(val);
}

export function paginate(page = 1, pageSize = 20) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function paginatedResult(data: any[], total: number, page = 1, pageSize = 20) {
  return { data, total, page, pageSize };
}

export class NotFoundError extends Error {
  constructor(msg = '记录不存在') { super(msg); this.name = 'NotFoundError'; }
}

export class BadRequestError extends Error {
  constructor(msg: string) { super(msg); this.name = 'BadRequestError'; }
}

export class ForbiddenError extends Error {
  constructor(msg = '无权操作') { super(msg); this.name = 'ForbiddenError'; }
}

export class ConflictError extends Error {
  constructor(msg: string) { super(msg); this.name = 'ConflictError'; }
}

export { default } from './index.js';
