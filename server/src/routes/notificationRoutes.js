const express = require('express');
const {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
  clearNotifications
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotifications)
  .delete(clearNotifications);

router.put('/read-all', markAllAsRead);
router.put('/:id/read', markNotificationAsRead);

module.exports = router;
