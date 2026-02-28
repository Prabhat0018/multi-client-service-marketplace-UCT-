const express = require('express');
const router = express.Router();

const {
  userSignup,
  userLogin,
  merchantSignup,
  merchantLogin
} = require('../controllers/auth.controller');

router.post('/user/signup', userSignup);
router.post('/user/login', userLogin);

router.post('/merchant/signup', merchantSignup);
router.post('/merchant/login', merchantLogin);

module.exports = router;