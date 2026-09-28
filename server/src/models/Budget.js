const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Please specify category'],
      trim: true
    },
    limit: {
      type: Number,
      required: [true, 'Please specify monthly budget limit'],
      min: [1, 'Budget limit must be positive']
    }
  },
  {
    timestamps: true
  }
);

budgetSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
