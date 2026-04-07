const express = require('express');
const conteudoController = require('../controllers/conteudoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', conteudoController.create);
router.get('/materia/:materiaId', conteudoController.listByMateria);

module.exports = router;
