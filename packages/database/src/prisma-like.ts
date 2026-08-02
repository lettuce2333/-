// @ts-nocheck
const db = require('./db-init.js');

function toSqlValue(val: any): string { return "''"; }

function bindValue(val: any): any {
  return typeof val === 'boolean' ? (val ? 1 : 0) : val;
}

function buildWhere(where: any, tableAlias = ''): { clause: string; params: any[] } {
  if (!where || Object.keys(where).length === 0) return { clause: '', params: [] };
  const prefix = tableAlias ? `${tableAlias}.` : '';
  const conditions: string[] = [];
  const params: any[] = [];
  for (const [key, val] of Object.entries(where)) {
    if (key === 'OR' || key === 'AND') {
      const op = key === 'OR' ? ' OR ' : ' AND ';
      const parts = (val as any[]).map((v: any) => { const r = buildWhere(v); return r.clause ? `(${r.clause})` : '1=1'; }).filter(Boolean);
      if (parts.length > 0) conditions.push(`(${parts.join(op)})`);
    } else if (['id','userId','shopId','productId','skuId','orderId','categoryId','parentId','ownerId','afterSaleId','reviewId'].includes(key) || key.endsWith('Id')) {
      conditions.push(`${prefix}${key} = ?`);
      params.push(Number(val));
    } else if (typeof val === 'object' && val !== null) {
      if ('contains' in val) { conditions.push(`${prefix}${key} LIKE ?`); params.push(`%${val.contains}%`); }
      else if ('in' in val && Array.isArray(val.in)) { conditions.push(`${prefix}${key} IN (${val.in.map(() => '?').join(',')})`); params.push(...val.in.map(bindValue)); }
      else if ('notIn' in val && Array.isArray(val.notIn)) { conditions.push(`${prefix}${key} NOT IN (${val.notIn.map(() => '?').join(',')})`); params.push(...val.notIn.map(bindValue)); }
      else if ('not' in val && val.not !== null && val.not !== undefined) { conditions.push(`${prefix}${key} != ?`); params.push(bindValue(val.not)); }
      else if ('equals' in val && val.equals !== null && val.equals !== undefined) { conditions.push(`${prefix}${key} = ?`); params.push(bindValue(val.equals)); }
      else if ('lte' in val) { conditions.push(`${prefix}${key} <= ?`); params.push(bindValue(val.lte instanceof Date ? val.lte.toISOString() : val.lte)); }
      else if ('gte' in val) { conditions.push(`${prefix}${key} >= ?`); params.push(bindValue(val.gte instanceof Date ? val.gte.toISOString() : val.gte)); }
    } else {
      conditions.push(`${prefix}${key} = ?`);
      params.push(bindValue(val));
    }
  }
  return { clause: conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '', params };
}

function modelNameToTable(name: string): string {
  const map: Record<string, string> = {
    user: 'User', address: 'Address', category: 'Category', shop: 'Shop',
    shopMember: 'ShopMember', product: 'Product', productSku: 'ProductSku',
    cartItem: 'CartItem', order: '"Order"', orderItem: 'OrderItem',
    orderStatusLog: 'OrderStatusLog', payment: 'Payment', logistics: 'Logistics',
    logisticsTemplate: 'LogisticsTemplate', afterSale: 'AfterSale',
    afterSaleLog: 'AfterSaleLog', review: 'Review', reviewReply: 'ReviewReply',
    favorite: 'Favorite', notification: 'Notification', userRole: 'UserRole',
  };
  return map[name] || name;
}

function queryOne(sql: string, params: any[]): any {
  const stmt = db.prepare(sql);
  const row = stmt.get(...params);
  return row;
}

function queryAll(sql: string, params: any[]): any[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

function execute(sql: string, params: any[]): any {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

function buildSets(data: Record<string, any>): { sets: string[]; vals: any[] } {
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (val === null || val === undefined) continue;
    if (val instanceof Date) { sets.push(`${key} = ?`); vals.push(val.toISOString()); continue; }
    if (typeof val === 'object') {
      if ('increment' in val) { sets.push(`${key} = ${key} + ?`); vals.push(bindValue(val.increment)); }
      else if ('decrement' in val) { sets.push(`${key} = ${key} - ?`); vals.push(bindValue(val.decrement)); }
      else if ('set' in val) { sets.push(`${key} = ?`); vals.push(bindValue(val.set)); }
      continue;
    }
    sets.push(`${key} = ?`);
    vals.push(bindValue(val));
  }
  return { sets, vals };
}

function doTransaction<T>(fn: () => T): T {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

// Each model method does NOT use `this` - avoids arrow function binding issues
function createModel(modelName: string) {
  const table = modelNameToTable(modelName);

  function findOne(where: Record<string, any>): any {
    const { clause, params } = buildWhere(where);
    const sql = `SELECT * FROM ${table} ${clause} LIMIT 1`;
    return queryOne(sql, params) || null;
  }

  function findMany(where: Record<string, any> | undefined, orderBy?: any, skip?: number, take?: number): any[] {
    const { clause, params } = buildWhere(where || {});
    let order = '';
    if (orderBy) { const [k, d] = Object.entries(orderBy)[0]; order = ` ORDER BY ${k} ${d === 'desc' ? 'DESC' : 'ASC'}`; }
    const limit = take ? ` LIMIT ${take}` : '';
    const off = skip ? ` OFFSET ${skip}` : '';
    return queryAll(`SELECT * FROM ${table}${clause}${order}${limit}${off}`, params);
  }

  function doCount(where: Record<string, any> | undefined): number {
    const { clause, params } = buildWhere(where || {});
    const row: any = queryOne(`SELECT COUNT(*) as cnt FROM ${table}${clause}`, params);
    return row?.cnt || 0;
  }

  function doCreate(data: Record<string, any>): any {
    const fields: string[] = [];
    const vals: any[] = [];
    const placeholders: string[] = [];
    for (const [key, val] of Object.entries(data)) {
      if (val === null || val === undefined) continue;
      if (val instanceof Date) { fields.push(key); vals.push(val.toISOString()); placeholders.push('?'); continue; }
      if (typeof val === 'object') continue;
      fields.push(key); vals.push(bindValue(val)); placeholders.push('?');
    }
    const result = execute(`INSERT INTO ${table} (${fields.join(',')}) VALUES (${placeholders.join(',')})`, vals);
    return findOne({ id: result!.lastInsertRowid });
  }

  function doUpdate(where: Record<string, any>, data: Record<string, any>): any {
    const { clause, params } = buildWhere(where);
    const { sets, vals } = buildSets(data);
    if (sets.length === 0) return findOne(where);
    execute(`UPDATE ${table} SET ${sets.join(',')}${clause}`, [...vals, ...params]);
    return findOne(where);
  }

  return {
    findUnique: (args: { where: Record<string, any> }) => findOne(args.where),
    findFirst: (args: { where: Record<string, any> }) => findOne(args.where),
    findMany: (args?: { where?: Record<string, any>; orderBy?: any; skip?: number; take?: number }) => findMany(args?.where, args?.orderBy, args?.skip, args?.take),
    count: (args?: { where?: Record<string, any> }) => doCount(args?.where),
    create: (args?: { data: Record<string, any> }) => doCreate(args?.data || {}),
    update: (args?: { where?: Record<string, any>; data?: Record<string, any> }) => doUpdate(args?.where || {}, args?.data || {}),
    updateMany: (args?: { where?: Record<string, any>; data?: Record<string, any> }) => {
      const { clause, params } = buildWhere(args.where || {});
      const { sets, vals } = buildSets(args.data || {});
      if (sets.length === 0) return { count: 0 };
      const result = execute(`UPDATE ${table} SET ${sets.join(',')}${clause}`, [...vals, ...params]);
      return { count: result?.changes || 0 };
    },
    delete: (args?: { where?: Record<string, any> }) => {
      const { clause, params } = buildWhere(args.where);
      execute(`DELETE FROM ${table}${clause}`, params);
    },
    deleteMany: (args?: { where?: Record<string, any> }) => {
      const { clause, params } = buildWhere(args.where || {});
      execute(`DELETE FROM ${table}${clause}`, params);
    },
    createMany: (args?: { data?: Record<string, any>[] }) => {
      if (!args?.data) return;
      for (const d of args.data) doCreate(d);
    },
    aggregate: (args?: { _sum?: any; where?: any }) => {
      if (!args) return {};
      const { clause, params } = buildWhere(args.where || {});
      if (args._sum) {
        const fields = Object.keys(args._sum).map(k => `COALESCE(SUM(${k}),0) as sum_${k}`).join(',');
        const row: any = queryOne(`SELECT ${fields} FROM ${table}${clause}`, params);
        const result: any = { _sum: {} };
        for (const k of Object.keys(args._sum)) result._sum[k] = row?.[`sum_${k}`] || 0;
        return result;
      }
      return {};
    },
  };
}

const prisma = new Proxy({} as any, {
  get(_: any, modelName: string) {
    if (modelName === '$transaction') {
      return async (fn: (tx: any) => Promise<any>) => doTransaction(() => { const r = fn(prisma); return r; });
    }
    if (modelName === '$disconnect' || modelName === '$on') return () => {};
    return createModel(modelName);
  },
});

export default prisma;
