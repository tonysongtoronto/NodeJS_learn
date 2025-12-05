
const express = require('express');

const errorsController = require('../controllers/errors');

const router = express.Router();

router.get('/500', errorsController.get500);
router.get('/404', errorsController.get404);

module.exports = router;