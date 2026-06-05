import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'src', 'lib', 'db.json');

// MongoDB Client configuration
const MONGODB_URI = process.env.MONGODB_URI;
let client = null;
let dbInstance = null;

async function getDb() {
  if (MONGODB_URI) {
    if (!client) {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
    }
    if (!dbInstance) {
      // Connects to DB specified in URL, or defaults to "upigateway"
      dbInstance = client.db();
    }
    return {
      type: 'mongodb',
      merchants: dbInstance.collection('merchants'),
      orders: dbInstance.collection('orders'),
      paytmTransactions: dbInstance.collection('paytmTransactions')
    };
  } else {
    // JSON Fallback
    const initDb = () => {
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
    };
    initDb();

    const readJson = () => {
      try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
      } catch (e) {
        return { merchants: [], orders: [], paytmTransactions: [] };
      }
    };

    const writeJson = (data) => {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    };

    return {
      type: 'json',
      read: readJson,
      write: writeJson
    };
  }
}

// Helper: Get merchant by API key
export async function getMerchantByApiKey(apiKey) {
  const db = await getDb();
  if (db.type === 'mongodb') {
    return await db.merchants.findOne({ apiKey });
  } else {
    const data = db.read();
    return data.merchants.find((m) => m.apiKey === apiKey);
  }
}

// Helper: Get merchant by ID
export async function getMerchantById(id) {
  const db = await getDb();
  if (db.type === 'mongodb') {
    return await db.merchants.findOne({ id });
  } else {
    const data = db.read();
    return data.merchants.find((m) => m.id === id);
  }
}

// Helper: Get merchant by email
export async function getMerchantByEmail(email) {
  const db = await getDb();
  if (db.type === 'mongodb') {
    return await db.merchants.findOne({ email });
  } else {
    const data = db.read();
    return data.merchants.find((m) => m.email === email);
  }
}

// Helper: Save merchant
export async function saveMerchant(merchant) {
  const db = await getDb();
  if (db.type === 'mongodb') {
    // Strip _id if present to prevent MongoDB immutable field error during updates
    const { _id, ...updateData } = merchant;
    await db.merchants.updateOne({ id: merchant.id }, { $set: updateData }, { upsert: true });
    return merchant;
  } else {
    const data = db.read();
    const index = data.merchants.findIndex((m) => m.id === merchant.id);
    if (index > -1) {
      data.merchants[index] = merchant;
    } else {
      data.merchants.push(merchant);
    }
    db.write(data);
    return merchant;
  }
}

// Helper: Create order
export async function createOrder(order) {
  const db = await getDb();
  if (db.type === 'mongodb') {
    await db.orders.insertOne(order);
    return order;
  } else {
    const data = db.read();
    data.orders.push(order);
    db.write(data);
    return order;
  }
}

// Helper: Get order by ID
export async function getOrderById(id) {
  const db = await getDb();
  if (db.type === 'mongodb') {
    return await db.orders.findOne({ id });
  } else {
    const data = db.read();
    return data.orders.find((o) => o.id === id);
  }
}

// Helper: Update order
export async function updateOrder(order) {
  const db = await getDb();
  if (db.type === 'mongodb') {
    const { _id, ...updateData } = order;
    const res = await db.orders.updateOne({ id: order.id }, { $set: updateData });
    return res.modifiedCount > 0 || res.matchedCount > 0;
  } else {
    const data = db.read();
    const index = data.orders.findIndex((o) => o.id === order.id);
    if (index > -1) {
      data.orders[index] = order;
      db.write(data);
      return true;
    }
    return false;
  }
}

// Helper: Get orders for a merchant
export async function getMerchantOrders(merchantId) {
  const db = await getDb();
  if (db.type === 'mongodb') {
    return await db.orders.find({ merchantId }).toArray();
  } else {
    const data = db.read();
    return data.orders.filter((o) => o.merchantId === merchantId);
  }
}

// Helper: Add Paytm credit transaction
export async function addPaytmTransaction(tx) {
  const db = await getDb();
  if (db.type === 'mongodb') {
    await db.paytmTransactions.insertOne(tx);
    return tx;
  } else {
    const data = db.read();
    data.paytmTransactions.push(tx);
    db.write(data);
    return tx;
  }
}

// Helper: List Paytm transactions for a Merchant ID
export async function getPaytmTransactions(paytmMID) {
  const db = await getDb();
  if (db.type === 'mongodb') {
    return await db.paytmTransactions.find({ paytmMID }).toArray();
  } else {
    const data = db.read();
    return data.paytmTransactions.filter((tx) => tx.paytmMID === paytmMID);
  }
}

// Helper: Claim a Paytm transaction
export async function claimPaytmTransaction(txnId) {
  const db = await getDb();
  if (db.type === 'mongodb') {
    const res = await db.paytmTransactions.updateOne({ txnId }, { $set: { isClaimed: true } });
    return res.modifiedCount > 0;
  } else {
    const data = db.read();
    const tx = data.paytmTransactions.find((t) => t.txnId === txnId);
    if (tx) {
      tx.isClaimed = true;
      db.write(data);
      return true;
    }
    return false;
  }
}

// Helper: Clear Paytm simulator transactions
export async function clearPaytmTransactions(paytmMID) {
  const db = await getDb();
  if (db.type === 'mongodb') {
    if (paytmMID) {
      await db.paytmTransactions.deleteMany({ paytmMID });
    } else {
      await db.paytmTransactions.deleteMany({});
    }
    return true;
  } else {
    const data = db.read();
    if (paytmMID) {
      data.paytmTransactions = data.paytmTransactions.filter((tx) => tx.paytmMID !== paytmMID);
    } else {
      data.paytmTransactions = [];
    }
    db.write(data);
    return true;
  }
}
