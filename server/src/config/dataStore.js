const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const defaultData = {
  users: [],
  transactions: [],
  budgets: [],
  notifications: []
};

class LocalDataStore {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
  }

  read() {
    try {
      this.ensureInitialized();
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return defaultData;
    }
  }

  write(data) {
    this.ensureInitialized();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  generateId() {
    return crypto.randomBytes(12).toString('hex');
  }

  // User operations
  findUserByEmail(email) {
    const data = this.read();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    const data = this.read();
    return data.users.find(u => u._id === id);
  }

  createUser(userData) {
    const data = this.read();
    const newUser = {
      _id: this.generateId(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      currency: userData.currency || 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.users.push(newUser);
    this.write(data);
    return newUser;
  }

  // Transaction operations
  findTransactions(userId, filters = {}) {
    const data = this.read();
    let list = data.transactions.filter(t => t.userId === userId);

    if (filters.type && filters.type !== 'all') {
      list = list.filter(t => t.type === filters.type);
    }
    if (filters.category && filters.category !== 'all') {
      list = list.filter(t => t.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(t => (t.title && t.title.toLowerCase().includes(q)) || (t.notes && t.notes.toLowerCase().includes(q)));
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      list = list.filter(t => new Date(t.date) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      list = list.filter(t => new Date(t.date) <= end);
    }

    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }

  createTransaction(txData) {
    const data = this.read();
    const tx = {
      _id: this.generateId(),
      userId: txData.userId,
      title: txData.title,
      amount: Number(txData.amount),
      type: txData.type,
      category: txData.category,
      paymentMethod: txData.paymentMethod || 'Card',
      date: txData.date || new Date().toISOString(),
      notes: txData.notes || '',
      createdAt: new Date().toISOString()
    };
    data.transactions.push(tx);
    this.write(data);
    return tx;
  }

  updateTransaction(id, userId, updates) {
    const data = this.read();
    const index = data.transactions.findIndex(t => t._id === id && t.userId === userId);
    if (index === -1) return null;

    data.transactions[index] = {
      ...data.transactions[index],
      ...updates,
      amount: updates.amount ? Number(updates.amount) : data.transactions[index].amount,
      updatedAt: new Date().toISOString()
    };
    this.write(data);
    return data.transactions[index];
  }

  deleteTransaction(id, userId) {
    const data = this.read();
    const initialLen = data.transactions.length;
    data.transactions = data.transactions.filter(t => !(t._id === id && t.userId === userId));
    const deleted = data.transactions.length < initialLen;
    if (deleted) this.write(data);
    return deleted;
  }

  // Budget operations
  getBudgets(userId) {
    const data = this.read();
    return data.budgets.filter(b => b.userId === userId);
  }

  upsertBudget(userId, category, limit) {
    const data = this.read();
    let budget = data.budgets.find(b => b.userId === userId && b.category.toLowerCase() === category.toLowerCase());
    if (budget) {
      budget.limit = Number(limit);
      budget.updatedAt = new Date().toISOString();
    } else {
      budget = {
        _id: this.generateId(),
        userId,
        category,
        limit: Number(limit),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.budgets.push(budget);
    }
    this.write(data);
    return budget;
  }

  deleteBudget(userId, category) {
    const data = this.read();
    data.budgets = data.budgets.filter(b => !(b.userId === userId && b.category.toLowerCase() === category.toLowerCase()));
    this.write(data);
    return true;
  }

  // Notification operations
  getNotifications(userId) {
    const data = this.read();
    return data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createNotification(notifData) {
    const data = this.read();
    const notif = {
      _id: this.generateId(),
      userId: notifData.userId,
      title: notifData.title,
      message: notifData.message,
      type: notifData.type || 'info', // 'warning' | 'alert' | 'success' | 'info'
      read: false,
      createdAt: new Date().toISOString()
    };
    data.notifications.unshift(notif);
    // Keep last 50 notifications per user
    const userNotifs = data.notifications.filter(n => n.userId === notifData.userId);
    if (userNotifs.length > 50) {
      const toRemove = userNotifs.slice(50).map(n => n._id);
      data.notifications = data.notifications.filter(n => !toRemove.includes(n._id));
    }
    this.write(data);
    return notif;
  }

  markNotificationRead(id, userId) {
    const data = this.read();
    const notif = data.notifications.find(n => n._id === id && n.userId === userId);
    if (notif) {
      notif.read = true;
      this.write(data);
      return notif;
    }
    return null;
  }

  markAllNotificationsRead(userId) {
    const data = this.read();
    data.notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    this.write(data);
    return true;
  }

  clearNotifications(userId) {
    const data = this.read();
    data.notifications = data.notifications.filter(n => n.userId !== userId);
    this.write(data);
    return true;
  }
}

module.exports = new LocalDataStore();
