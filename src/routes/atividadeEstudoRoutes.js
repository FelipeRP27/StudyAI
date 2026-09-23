const express = require('express');
const atividadeEstudoController = require('../controllers/atividadeEstudoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', atividadeEstudoController.registrar);

module.exports = router;
