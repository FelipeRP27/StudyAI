const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/status', (req, res) => {
  res.status(200).json({
    message: 'Protected route available',
    user: req.user
  });
});

module.exports = router;
