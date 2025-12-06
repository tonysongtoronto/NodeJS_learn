const express = require('express');

const shopController = require('../controllers/shop');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);
router.get('/product/:productId', shopController.getProduct);

router.get('/cart', shopController.getCart);

router.post('/cart', shopController.postCart);
router.post('/cart-delete-item', shopController.postDeleteCartProduct);

router.get('/orders', shopController.getOrders);
router.get('/order/:orderId', isAuth, shopController.getInvoice);

 router.get('/checkout', shopController.getCheckout);
 router.post('/create-order', shopController.postOrder);

module.exports = router;