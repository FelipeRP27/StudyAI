const express = require('express');
const tarefaController = require('../controllers/tarefaController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', tarefaController.create);
router.get('/', tarefaController.listByUser);
router.put('/:id', tarefaController.update);
router.patch('/:id/status', tarefaController.setStatus);
router.delete('/:id', tarefaController.remove);

module.exports = router;
