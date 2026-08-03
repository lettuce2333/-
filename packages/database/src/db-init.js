const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

function findPackageRoot(dir) {
  let current = dir;
  for (;;) {
    if (fs.existsSync(path.join(current, 'package.json'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return dir;
    current = parent;
  }
}

const DB_PATH = path.resolve(findPackageRoot(__dirname), 'prisma', 'dev.db');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const isNew = !fs.existsSync(DB_PATH);
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode=WAL');
db.exec('PRAGMA foreign_keys=ON');

if (isNew) {
  console.log('Creating database schema...');
  db.exec("CREATE TABLE IF NOT EXISTS User (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, phone TEXT, password TEXT NOT NULL, nickname TEXT, avatar TEXT, status TEXT NOT NULL DEFAULT 'active', createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')))");
  db.exec("CREATE TABLE IF NOT EXISTS UserRole (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, role TEXT NOT NULL, FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE, UNIQUE(userId, role))");
  db.exec("CREATE TABLE IF NOT EXISTS Address (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, receiver TEXT NOT NULL, phone TEXT NOT NULL, province TEXT NOT NULL, city TEXT NOT NULL, district TEXT NOT NULL, detail TEXT NOT NULL, isDefault INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE)");
  db.exec("CREATE TABLE IF NOT EXISTS Category (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, parentId INTEGER, level INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0, image TEXT, FOREIGN KEY (parentId) REFERENCES Category(id))");
  db.exec("CREATE TABLE IF NOT EXISTS Shop (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, logo TEXT, contactPhone TEXT, status TEXT NOT NULL DEFAULT 'pending', ownerId INTEGER NOT NULL UNIQUE, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (ownerId) REFERENCES User(id))");
  db.exec("CREATE TABLE IF NOT EXISTS ShopMember (id INTEGER PRIMARY KEY AUTOINCREMENT, shopId INTEGER NOT NULL, userId INTEGER NOT NULL, role TEXT NOT NULL, FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE, FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE, UNIQUE(shopId, userId))");
  db.exec("CREATE TABLE IF NOT EXISTS Product (id INTEGER PRIMARY KEY AUTOINCREMENT, shopId INTEGER NOT NULL, categoryId INTEGER NOT NULL, name TEXT NOT NULL, description TEXT, images TEXT NOT NULL DEFAULT '[]', price REAL NOT NULL DEFAULT 0, totalStock INTEGER NOT NULL DEFAULT 0, sales INTEGER NOT NULL DEFAULT 0, variants TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft', createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (shopId) REFERENCES Shop(id), FOREIGN KEY (categoryId) REFERENCES Category(id))");
  db.exec("CREATE TABLE IF NOT EXISTS ProductSku (id INTEGER PRIMARY KEY AUTOINCREMENT, productId INTEGER NOT NULL, specs TEXT NOT NULL DEFAULT '', price REAL NOT NULL, stock INTEGER NOT NULL DEFAULT 0, image TEXT, FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE)");
  db.exec("CREATE TABLE IF NOT EXISTS CartItem (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, guestId TEXT, productId INTEGER NOT NULL, skuId INTEGER NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, FOREIGN KEY (productId) REFERENCES Product(id), FOREIGN KEY (skuId) REFERENCES ProductSku(id), FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE)");
  db.exec("CREATE TABLE IF NOT EXISTS \"Order\" (id INTEGER PRIMARY KEY AUTOINCREMENT, orderNo TEXT NOT NULL UNIQUE, userId INTEGER NOT NULL, shopId INTEGER NOT NULL, totalAmount REAL NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT', receiverName TEXT, receiverPhone TEXT, receiverAddress TEXT, paidAt TEXT, shippedAt TEXT, receivedAt TEXT, completedAt TEXT, cancelReason TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (userId) REFERENCES User(id), FOREIGN KEY (shopId) REFERENCES Shop(id))");
  db.exec("CREATE TABLE IF NOT EXISTS OrderItem (id INTEGER PRIMARY KEY AUTOINCREMENT, orderId INTEGER NOT NULL, productId INTEGER NOT NULL, skuId INTEGER NOT NULL, productName TEXT NOT NULL, skuSpecs TEXT NOT NULL DEFAULT '{}', quantity INTEGER NOT NULL, unitPrice REAL NOT NULL, subtotal REAL NOT NULL, image TEXT, FOREIGN KEY (orderId) REFERENCES \"Order\"(id) ON DELETE CASCADE, FOREIGN KEY (productId) REFERENCES Product(id), FOREIGN KEY (skuId) REFERENCES ProductSku(id))");
  db.exec("CREATE TABLE IF NOT EXISTS OrderStatusLog (id INTEGER PRIMARY KEY AUTOINCREMENT, orderId INTEGER NOT NULL, fromStatus TEXT, toStatus TEXT NOT NULL, operator TEXT NOT NULL, remark TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (orderId) REFERENCES \"Order\"(id) ON DELETE CASCADE)");
  db.exec("CREATE TABLE IF NOT EXISTS Payment (id INTEGER PRIMARY KEY AUTOINCREMENT, orderId INTEGER NOT NULL, amount REAL NOT NULL, method TEXT NOT NULL DEFAULT 'mock_wallet', paidAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (orderId) REFERENCES \"Order\"(id) ON DELETE CASCADE)");
  db.exec("CREATE TABLE IF NOT EXISTS Logistics (id INTEGER PRIMARY KEY AUTOINCREMENT, orderId INTEGER NOT NULL UNIQUE, company TEXT, trackingNo TEXT, status TEXT NOT NULL DEFAULT 'pending', shippedAt TEXT, deliveredAt TEXT, FOREIGN KEY (orderId) REFERENCES \"Order\"(id) ON DELETE CASCADE)");
  db.exec("CREATE TABLE IF NOT EXISTS LogisticsTemplate (id INTEGER PRIMARY KEY AUTOINCREMENT, shopId INTEGER NOT NULL, name TEXT NOT NULL, company TEXT NOT NULL, price REAL NOT NULL DEFAULT 0, FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE)");
  db.exec("CREATE TABLE IF NOT EXISTS AfterSale (id INTEGER PRIMARY KEY AUTOINCREMENT, orderId INTEGER NOT NULL, userId INTEGER NOT NULL, shopId INTEGER NOT NULL, type TEXT NOT NULL, reason TEXT NOT NULL, amount REAL NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', appliedAt TEXT NOT NULL DEFAULT (datetime('now')), autoApprovedAt TEXT, resolvedAt TEXT, FOREIGN KEY (orderId) REFERENCES \"Order\"(id), FOREIGN KEY (userId) REFERENCES User(id), FOREIGN KEY (shopId) REFERENCES Shop(id))");
  db.exec("CREATE TABLE IF NOT EXISTS AfterSaleLog (id INTEGER PRIMARY KEY AUTOINCREMENT, afterSaleId INTEGER NOT NULL, operator TEXT NOT NULL, action TEXT NOT NULL, remark TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (afterSaleId) REFERENCES AfterSale(id) ON DELETE CASCADE)");
  db.exec("CREATE TABLE IF NOT EXISTS Review (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, productId INTEGER NOT NULL, orderId INTEGER NOT NULL, rating INTEGER NOT NULL, content TEXT NOT NULL, images TEXT NOT NULL DEFAULT '[]', isAnonymous INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (userId) REFERENCES User(id), FOREIGN KEY (productId) REFERENCES Product(id), FOREIGN KEY (orderId) REFERENCES \"Order\"(id), UNIQUE(userId, orderId, productId))");
  db.exec("CREATE TABLE IF NOT EXISTS ReviewReply (id INTEGER PRIMARY KEY AUTOINCREMENT, reviewId INTEGER NOT NULL, shopId INTEGER NOT NULL, content TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (reviewId) REFERENCES Review(id) ON DELETE CASCADE, FOREIGN KEY (shopId) REFERENCES Shop(id))");
  db.exec("CREATE TABLE IF NOT EXISTS Favorite (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, productId INTEGER NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE, FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE, UNIQUE(userId, productId))");
  db.exec("CREATE TABLE IF NOT EXISTS Notification (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, content TEXT, isRead INTEGER NOT NULL DEFAULT 0, relatedId INTEGER, createdAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (userId) REFERENCES User(id))");
  console.log('Schema created');
}

db.exec("CREATE TABLE IF NOT EXISTS CourtCase (id INTEGER PRIMARY KEY AUTOINCREMENT, caseNo TEXT NOT NULL UNIQUE, afterSaleId INTEGER NOT NULL UNIQUE, initiator TEXT NOT NULL DEFAULT 'buyer', status TEXT NOT NULL DEFAULT 'JUDGING', buyerStatement TEXT NOT NULL DEFAULT '', shopStatement TEXT NOT NULL DEFAULT '', buyerEvidence TEXT NOT NULL DEFAULT '[]', shopEvidence TEXT NOT NULL DEFAULT '[]', buyerRebuttal TEXT NOT NULL DEFAULT '', shopRebuttal TEXT NOT NULL DEFAULT '', judgeCount INTEGER NOT NULL DEFAULT 9, voteDeadline TEXT NOT NULL, openedAt TEXT NOT NULL DEFAULT (datetime('now')), closedAt TEXT, adminDecision TEXT, adminRemark TEXT, FOREIGN KEY (afterSaleId) REFERENCES AfterSale(id))");
db.exec("CREATE TABLE IF NOT EXISTS CourtVote (id INTEGER PRIMARY KEY AUTOINCREMENT, caseId INTEGER NOT NULL, userId INTEGER NOT NULL, side TEXT NOT NULL, comment TEXT NOT NULL DEFAULT '', createdAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (caseId) REFERENCES CourtCase(id) ON DELETE CASCADE, FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE, UNIQUE(caseId, userId))");
db.exec("CREATE TABLE IF NOT EXISTS CourtTokenAccount (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL UNIQUE, balance INTEGER NOT NULL DEFAULT 0, totalEarned INTEGER NOT NULL DEFAULT 0, updatedAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE)");
db.exec("CREATE TABLE IF NOT EXISTS TokenTransaction (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, type TEXT NOT NULL, amount INTEGER NOT NULL, uniqueKey TEXT UNIQUE, caseId INTEGER, couponId INTEGER, redemptionOrderId INTEGER, createdAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE)");
db.exec("CREATE TABLE IF NOT EXISTS Coupon (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, title TEXT NOT NULL, amount REAL NOT NULL, minSpend REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'unused', expiresAt TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')), orderId INTEGER UNIQUE, FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE)");
db.exec("CREATE TABLE IF NOT EXISTS RedemptionOrder (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, orderNo TEXT NOT NULL UNIQUE, totalTokens INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', createdAt TEXT NOT NULL DEFAULT (datetime('now')), completedAt TEXT, FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE)");
db.exec("CREATE TABLE IF NOT EXISTS RedemptionOrderItem (id INTEGER PRIMARY KEY AUTOINCREMENT, redemptionOrderId INTEGER NOT NULL, productId INTEGER NOT NULL, skuId INTEGER NOT NULL, productName TEXT NOT NULL, skuSpecs TEXT NOT NULL DEFAULT '', quantity INTEGER NOT NULL, tokenPrice INTEGER NOT NULL, image TEXT, FOREIGN KEY (redemptionOrderId) REFERENCES RedemptionOrder(id) ON DELETE CASCADE, FOREIGN KEY (productId) REFERENCES Product(id), FOREIGN KEY (skuId) REFERENCES ProductSku(id))");

// 旧数据库缺少本次提交新增的列时自动补列，避免拉取新代码后保存商品报错
function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Migrated ${table}: added ${column}`);
  }
}

ensureColumn('Product', 'variants', "TEXT NOT NULL DEFAULT ''");
ensureColumn('Product', 'tokenPrice', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('"Order"', 'couponId', 'INTEGER');
ensureColumn('"Order"', 'couponAmount', 'REAL NOT NULL DEFAULT 0');

module.exports = db;
