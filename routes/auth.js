const express = require('express');

const userValidator = require('../validators/user');

const authController = require('../controllers/auth');
const isLogged = require('../middleware/is-logged');

const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login', isLogged, userValidator.login, authController.postLogin);

router.get('/signup', authController.getSignup);

router.post('/signup', isLogged, userValidator.signup, authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', isLogged, authController.getReset);

router.post('/reset', isLogged, userValidator.resetPassword, authController.postReset);

router.get('/reset/:resetToken', authController.getNewPassword);

router.post('/new-password', isLogged, userValidator.setNewPassword, authController.postNewPassword);

module.exports = router;
