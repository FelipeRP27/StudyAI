const express = require('express');
const proximoPassoController = require('../controllers/proximoPassoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', proximoPassoController.get);

module.exports = router;
