const express = require('express');
const respostaController = require('../controllers/respostaController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', respostaController.responder);
router.get('/questao/:questaoId', respostaController.listByQuestao);

module.exports = router;
