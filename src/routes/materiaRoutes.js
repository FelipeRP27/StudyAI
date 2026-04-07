const express = require('express');
const materiaController = require('../controllers/materiaController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', materiaController.create);
router.get('/', materiaController.listByUser);
router.put('/:id', materiaController.update);
router.delete('/:id', materiaController.remove);

module.exports = router;
