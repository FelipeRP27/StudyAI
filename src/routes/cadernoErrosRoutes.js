const express = require('express');
const cadernoErrosController = require('../controllers/cadernoErrosController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', cadernoErrosController.listar);
router.get('/resumo', cadernoErrosController.resumir);

module.exports = router;
