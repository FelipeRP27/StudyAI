const express = require('express');
const flashcardController = require('../controllers/flashcardController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', flashcardController.create);
router.get('/conteudo/:conteudoId', flashcardController.listByConteudo);

module.exports = router;
