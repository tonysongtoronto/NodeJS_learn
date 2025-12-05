const express = require('express');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const router = express.Router();
const productValidator = require('../validators/product');

// /admin/add-product => GET
router.get('/add-product', isAuth,adminController.getAddProduct);

// /admin/products => GET
router.get('/products',isAuth, adminController.getProducts);

router.get('/edit-product/:productId',isAuth, adminController.getEditProduct);


router.post('/add-product', isAuth, productValidator.productInfo, adminController.postAddProduct);

// /admin/edit-product => POST
router.post('/edit-product', isAuth, productValidator.productInfo, adminController.postEditProduct);

 // /admin/delete-product => POST
router.post('/delete-product',isAuth, adminController.postDeleteProduct);

module.exports = router;
