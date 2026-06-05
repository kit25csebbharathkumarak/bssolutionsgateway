import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'src', 'lib', 'db.json');

// Ensure database file exists
function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(
      DB_PATH,
      JSON.stringify({ merchants: [], orders: [], paytmTransactions: [] }, null, 2),
      'utf8'
    );
  }
}

// Read database
export function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return { merchants: [], orders: [], paytmTransactions: [] };
  }
}

// Write database
export function writeDb(data) {
  initDb();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing DB:', error);
    return false;
  }
}

// Helper: Get merchant by API key
export function getMerchantByApiKey(apiKey) {
  const db = readDb();
  return db.merchants.find((m) => m.apiKey === apiKey);
}

// Helper: Get merchant by ID
export function getMerchantById(id) {
  const db = readDb();
  return db.merchants.find((m) => m.id === id);
}

// Helper: Get merchant by email
export function getMerchantByEmail(email) {
  const db = readDb();
  return db.merchants.find((m) => m.email === email);
}

// Helper: Save merchant
export function saveMerchant(merchant) {
  const db = readDb();
  const index = db.merchants.findIndex((m) => m.id === merchant.id);
  if (index > -1) {
    db.merchants[index] = merchant;
  } else {
    db.merchants.push(merchant);
  }
  writeDb(db);
  return merchant;
}

// Helper: Create order
export function createOrder(order) {
  const db = readDb();
  db.orders.push(order);
  writeDb(db);
  return order;
}

// Helper: Get order by ID
export function getOrderById(id) {
  const db = readDb();
  return db.orders.find((o) => o.id === id);
}

// Helper: Update order
export function updateOrder(order) {
  const db = readDb();
  const index = db.orders.findIndex((o) => o.id === order.id);
  if (index > -1) {
    db.orders[index] = order;
    writeDb(db);
    return true;
  }
  return false;
}

// Helper: Get orders for a merchant
export function getMerchantOrders(merchantId) {
  const db = readDb();
  return db.orders.filter((o) => o.merchantId === merchantId);
}

// Helper: Add Paytm credit transaction
export function addPaytmTransaction(tx) {
  const db = readDb();
  db.paytmTransactions.push(tx);
  writeDb(db);
  return tx;
}

// Helper: List Paytm transactions for a Merchant ID
export function getPaytmTransactions(paytmMID) {
  const db = readDb();
  return db.paytmTransactions.filter((tx) => tx.paytmMID === paytmMID);
}

// Helper: Claim a Paytm transaction
export function claimPaytmTransaction(txnId) {
  const db = readDb();
  const tx = db.paytmTransactions.find((t) => t.txnId === txnId);
  if (tx) {
    tx.isClaimed = true;
    writeDb(db);
    return true;
  }
  return false;
}
