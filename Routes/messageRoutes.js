const express = require('express');
const { protect } = require('../Middleware/authMiddleware');
const { sendMessage, fetchMessages } = require('../Controllers/messageControllers');

const router = express.Router();
router.route('/').post(protect, sendMessage);
router.route('/:chatId').get(protect, fetchMessages);

module.exports = router;