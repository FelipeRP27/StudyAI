const express = require('express');
const processamentoController = require('../controllers/processamentoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/conteudo/:conteudoId', processamentoController.processarConteudo);
router.get('/conteudo/:conteudoId', processamentoController.listByConteudo);

module.exports = router;
