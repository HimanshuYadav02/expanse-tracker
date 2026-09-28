const express = require('express');
const { getAnomalyReport, getAuditReport } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/anomaly-detection', getAnomalyReport);
router.get('/audit-report', getAuditReport);

module.exports = router;
