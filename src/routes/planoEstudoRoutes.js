const express = require('express');
const planoEstudoController = require('../controllers/planoEstudoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', planoEstudoController.get);

module.exports = router;
