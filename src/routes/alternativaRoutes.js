const express = require('express');
const alternativaController = require('../controllers/alternativaController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', alternativaController.create);
router.get('/questao/:questaoId', alternativaController.listByQuestao);

module.exports = router;
