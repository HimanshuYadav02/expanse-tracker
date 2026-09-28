const mongoose = require('mongoose');
const { getIsMongoConnected } = require('../config/db');
const Notification = require('../models/Notification');
const dataStore = require('../config/dataStore');

// @desc    Get all notifications for user
// @route   GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    let notifications = [];
    if (getIsMongoConnected()) {
      notifications = await Notification.find({
        userId: new mongoose.Types.ObjectId(userId)
      })
        .sort('-createdAt')
        .limit(40);
    } else {
      notifications = dataStore.getNotifications(userId);
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return res.json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
const markNotificationAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;

    if (getIsMongoConnected()) {
      const notif = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { read: true },
        { new: true }
      );
      if (!notif) {
        return res.status(404).json({ success: false, error: 'Notification not found' });
      }
      return res.json({ success: true, data: notif });
    } else {
      const notif = dataStore.markNotificationRead(id, userId);
      if (!notif) {
        return res.status(404).json({ success: false, error: 'Notification not found' });
      }
      return res.json({ success: true, data: notif });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    if (getIsMongoConnected()) {
      await Notification.updateMany({ userId, read: false }, { read: true });
    } else {
      dataStore.markAllNotificationsRead(userId);
    }

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications
const clearNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    if (getIsMongoConnected()) {
      await Notification.deleteMany({ userId });
    } else {
      dataStore.clearNotifications(userId);
    }

    return res.json({ success: true, message: 'Notifications cleared' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
  clearNotifications
};
