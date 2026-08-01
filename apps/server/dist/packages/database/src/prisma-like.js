"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require('./db-init.js');
function toSqlValue(val) { return "''"; }
function buildWhere(where, tableAlias = '') {
    if (!where || Object.keys(where).length === 0)
        return { clause: '', params: [] };
    const prefix = tableAlias ? `${tableAlias}.` : '';
    const conditions = [];
    const params = [];
    for (const [key, val] of Object.entries(where)) {
        if (key === 'OR' || key === 'AND') {
            const op = key === 'OR' ? ' OR ' : ' AND ';
            const parts = val.map((v) => { const r = buildWhere(v); return r.clause ? `(${r.clause})` : '1=1'; }).filter(Boolean);
            if (parts.length > 0)
                conditions.push(`(${parts.join(op)})`);
        }
        else if (['id', 'userId', 'shopId', 'productId', 'skuId', 'orderId', 'categoryId', 'parentId', 'ownerId', 'afterSaleId', 'reviewId'].includes(key) || key.endsWith('Id')) {
            conditions.push(`${prefix}${key} = ?`);
            params.push(Number(val));
        }
        else if (typeof val === 'object' && val !== null) {
            if ('contains' in val) {
                conditions.push(`${prefix}${key} LIKE ?`);
                params.push(`%${val.contains}%`);
            }
            else if ('in' in val && Array.isArray(val.in)) {
                conditions.push(`${prefix}${key} IN (${val.in.map(() => '?').join(',')})`);
                params.push(...val.in);
            }
            else if ('lte' in val) {
                conditions.push(`${prefix}${key} <= ?`);
                params.push(val.lte instanceof Date ? val.lte.toISOString() : val.lte);
            }
            else if ('gte' in val) {
                conditions.push(`${prefix}${key} >= ?`);
                params.push(val.gte instanceof Date ? val.gte.toISOString() : val.gte);
            }
            else if ('notIn' in val && Array.isArray(val.notIn)) {
                conditions.push(`${prefix}${key} NOT IN (${val.notIn.map(() => '?').join(',')})`);
                params.push(...val.notIn);
            }
        }
        else {
            conditions.push(`${prefix}${key} = ?`);
            params.push(val);
        }
    }
    return { clause: conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '', params };
}
function modelNameToTable(name) {
    const map = {
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
function queryOne(sql, params) {
    const stmt = db.prepare(sql);
    const row = stmt.get(...params);
    return row;
}
function queryAll(sql, params) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
}
function execute(sql, params) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
}
function doTransaction(fn) {
    db.exec('BEGIN');
    try {
        const r = fn();
        db.exec('COMMIT');
        return r;
    }
    catch (e) {
        db.exec('ROLLBACK');
        throw e;
    }
}
function createModel(modelName) {
    const table = modelNameToTable(modelName);
    function findOne(where) {
        const { clause, params } = buildWhere(where);
        const sql = `SELECT * FROM ${table} ${clause} LIMIT 1`;
        return queryOne(sql, params) || null;
    }
    function findMany(where, orderBy, skip, take) {
        const { clause, params } = buildWhere(where || {});
        let order = '';
        if (orderBy) {
            const [k, d] = Object.entries(orderBy)[0];
            order = ` ORDER BY ${k} ${d === 'desc' ? 'DESC' : 'ASC'}`;
        }
        const limit = take ? ` LIMIT ${take}` : '';
        const off = skip ? ` OFFSET ${skip}` : '';
        return queryAll(`SELECT * FROM ${table}${clause}${order}${limit}${off}`, params);
    }
    function doCount(where) {
        const { clause, params } = buildWhere(where || {});
        const row = queryOne(`SELECT COUNT(*) as cnt FROM ${table}${clause}`, params);
        return row?.cnt || 0;
    }
    function doCreate(data) {
        const fields = [];
        const vals = [];
        const placeholders = [];
        for (const [key, val] of Object.entries(data)) {
            if (val === null || val === undefined)
                continue;
            if (val instanceof Date) {
                fields.push(key);
                vals.push(val.toISOString());
                placeholders.push('?');
                continue;
            }
            if (typeof val === 'object')
                continue;
            fields.push(key);
            vals.push(val);
            placeholders.push('?');
        }
        const result = execute(`INSERT INTO ${table} (${fields.join(',')}) VALUES (${placeholders.join(',')})`, vals);
        return findOne({ id: result.lastInsertRowid });
    }
    function doUpdate(where, data) {
        const { clause, params } = buildWhere(where);
        const sets = [];
        const vals = [];
        for (const [key, val] of Object.entries(data)) {
            if (val === null || val === undefined || typeof val === 'object')
                continue;
            sets.push(`${key} = ?`);
            vals.push(val);
        }
        execute(`UPDATE ${table} SET ${sets.join(',')}${clause}`, [...vals, ...params]);
        return findOne(where);
    }
    return {
        findUnique: (args) => findOne(args.where),
        findFirst: (args) => findOne(args.where),
        findMany: (args) => findMany(args?.where, args?.orderBy, args?.skip, args?.take),
        count: (args) => doCount(args?.where),
        create: (args) => doCreate(args?.data || {}),
        update: (args) => doUpdate(args?.where || {}, args?.data || {}),
        updateMany: (args) => {
            const { clause, params } = buildWhere(args.where || {});
            const sets = [];
            const vals = [];
            for (const [key, val] of Object.entries(args.data)) {
                sets.push(`${key} = ?`);
                vals.push(val);
            }
            execute(`UPDATE ${table} SET ${sets.join(',')}${clause}`, [...vals, ...params]);
        },
        delete: (args) => {
            const { clause, params } = buildWhere(args.where);
            execute(`DELETE FROM ${table}${clause}`, params);
        },
        deleteMany: (args) => {
            const { clause, params } = buildWhere(args.where || {});
            execute(`DELETE FROM ${table}${clause}`, params);
        },
        createMany: (args) => {
            if (!args?.data)
                return;
            for (const d of args.data)
                doCreate(d);
        },
        aggregate: (args) => {
            if (!args)
                return {};
            const { clause, params } = buildWhere(args.where || {});
            if (args._sum) {
                const fields = Object.keys(args._sum).map(k => `COALESCE(SUM(${k}),0) as sum_${k}`).join(',');
                const row = queryOne(`SELECT ${fields} FROM ${table}${clause}`, params);
                const result = { _sum: {} };
                for (const k of Object.keys(args._sum))
                    result._sum[k] = row?.[`sum_${k}`] || 0;
                return result;
            }
            return {};
        },
    };
}
const prisma = new Proxy({}, {
    get(_, modelName) {
        if (modelName === '$transaction') {
            return async (fn) => doTransaction(() => { const r = fn(prisma); return r; });
        }
        if (modelName === '$disconnect' || modelName === '$on')
            return () => { };
        return createModel(modelName);
    },
});
exports.default = prisma;
//# sourceMappingURL=prisma-like.js.map