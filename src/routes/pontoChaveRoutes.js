const express = require('express');
const pontoChaveController = require('../controllers/pontoChaveController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', pontoChaveController.create);
router.get('/conteudo/:conteudoId', pontoChaveController.listByConteudo);

module.exports = router;
