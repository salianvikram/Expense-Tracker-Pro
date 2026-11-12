import express from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All transaction routes require authentication
router.use(protect);

// ── GET /api/transactions ────────────────────────────────────────────────────
// Query params: type, category, month (1-12), year, search, page, limit
router.get('/', async (req, res) => {
  try {
    const { type, category, month, year, search, page = 1, limit = 50 } = req.query;

    const filter = { userId: req.userId };

    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    // Month/year filter
    if (month || year) {
      const y = parseInt(year) || new Date().getFullYear();
      if (month) {
        const m = parseInt(month) - 1; // 0-indexed
        filter.date = {
          $gte: new Date(y, m, 1),
          $lt: new Date(y, m + 1, 1),
        };
      } else {
        filter.date = {
          $gte: new Date(y, 0, 1),
          $lt: new Date(y + 1, 0, 1),
        };
      }
    }

    // Text search on title
    if (search?.trim()) {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// ── GET /api/transactions/summary ────────────────────────────────────────────
// Returns totals + category breakdown. Accepts same month/year filters.
router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { userId: req.userId };

    if (month || year) {
      const y = parseInt(year) || new Date().getFullYear();
      if (month) {
        const m = parseInt(month) - 1;
        filter.date = {
          $gte: new Date(y, m, 1),
          $lt: new Date(y, m + 1, 1),
        };
      } else {
        filter.date = {
          $gte: new Date(y, 0, 1),
          $lt: new Date(y + 1, 0, 1),
        };
      }
    }

    const [totals, categoryBreakdown, monthlyTrend] = await Promise.all([
      // Income / expense totals
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Category breakdown (expenses only)
      Transaction.aggregate([
        { $match: { ...filter, type: 'expense' } },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Monthly trend — last 6 months (all time, ignore month filter)
      Transaction.aggregate([
        { $match: { userId: req.userId } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const income = totals.find((t) => t._id === 'income')?.total || 0;
    const expenses = totals.find((t) => t._id === 'expense')?.total || 0;

    res.json({
      income,
      expenses,
      balance: income - expenses,
      savings: income - expenses,
      categoryBreakdown,
      monthlyTrend,
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
});

// ── POST /api/transactions ────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, amount, type, category, date, notes } = req.body;

    if (!title?.trim() || !amount || !type || !category) {
      return res.status(400).json({ message: 'Title, amount, type and category are required' });
    }

    const parsedAmount = parseFloat(amount);
    if (!isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Type must be income or expense' });
    }

    const transaction = await Transaction.create({
      userId: req.userId,
      title: title.trim(),
      amount: parsedAmount,
      type,
      category,
      date: date ? new Date(date) : new Date(),
      notes: notes?.trim() || '',
    });

    res.status(201).json({ transaction });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    console.error('Create transaction error:', err);
    res.status(500).json({ message: 'Failed to create transaction' });
  }
});

// ── PUT /api/transactions/:id ─────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    const transaction = await Transaction.findOne({ _id: id, userId: req.userId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const { title, amount, type, category, date, notes } = req.body;

    if (title !== undefined) transaction.title = title.trim();
    if (amount !== undefined) {
      const parsed = parseFloat(amount);
      if (!isFinite(parsed) || parsed <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }
      transaction.amount = parsed;
    }
    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ message: 'Type must be income or expense' });
      }
      transaction.type = type;
    }
    if (category !== undefined) transaction.category = category;
    if (date !== undefined) transaction.date = new Date(date);
    if (notes !== undefined) transaction.notes = notes.trim();

    await transaction.save();

    res.json({ transaction });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    console.error('Update transaction error:', err);
    res.status(500).json({ message: 'Failed to update transaction' });
  }
});

// ── DELETE /api/transactions/:id ──────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    const transaction = await Transaction.findOneAndDelete({ _id: id, userId: req.userId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted', id });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ message: 'Failed to delete transaction' });
  }
});

export default router;
