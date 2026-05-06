const express = require('express');
const desempenhoController = require('../controllers/desempenhoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', desempenhoController.get);

module.exports = router;
