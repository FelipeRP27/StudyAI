const express = require('express');
const resumoController = require('../controllers/resumoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', resumoController.create);
router.get('/conteudo/:conteudoId', resumoController.listByConteudo);

module.exports = router;
