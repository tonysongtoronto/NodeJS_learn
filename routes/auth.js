const express = require('express');

const authController = require('../controllers/auth');
const isLogged = require('../middleware/is-logged');

const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login', authController.postLogin);

router.get('/signup', authController.getSignup);

router.post('/signup', authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', isLogged, authController.getReset);

router.post('/reset', isLogged, authController.postReset);

router.get('/reset/:resetToken', authController.getNewPassword);

router.post('/new-password', isLogged, authController.postNewPassword);

module.exports = router;
