const express = require('express');
const questaoController = require('../controllers/questaoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', questaoController.create);
router.get('/conteudo/:conteudoId', questaoController.listByConteudo);

module.exports = router;
