const express = require('express');
const painelController = require('../controllers/painelController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', painelController.get);

module.exports = router;
