const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const fsSync = require('fs');
const ITEMS_PER_PAGE = require('../util/general-keys').ITEMS_PER_PAGE;


module.exports.getIndex = (req, res, next) => {
    let page = +req.query.page || 1;
    page = Math.max(page, 1);
    let totalItems;

    Product
        .find()
        .countDocuments()
        .then(count => {
            totalItems = count;

            return Product
                .find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then(products => {
            const currentPage = page;
            const lastPage = Math.ceil(totalItems / ITEMS_PER_PAGE);
            const hasPreviousPage = page > 1;
            // const hasNextPage = page * ITEMS_PER_PAGE < totalItems;
            const hasNextPage = page < lastPage;

            res.render('shop/index', {
                pageTitle: 'Shop',
                path: '/',
                products: products,
                currentPage: currentPage,
                hasPreviousPage: hasPreviousPage,
                hasNextPage: hasNextPage,
                lastPage: lastPage
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

module.exports.getProducts = (req, res, next) => {
    let page = +req.query.page || 1;
    page = Math.max(page, 1);
    let totalItems;

    Product
        .find()
        .countDocuments()
        .then(count => {
            totalItems = count;

            return Product
                .find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then(products => {
            const lastPage = Math.ceil(totalItems / ITEMS_PER_PAGE);
            const hasPreviousPage = page > 1;
            const hasNextPage = page < lastPage;

            res.render('shop/product-list', {
                pageTitle: 'Products',
                path: '/products',
                products: products,
                currentPage: page,
                lastPage: lastPage,
                hasPreviousPage: hasPreviousPage,
                hasNextPage: hasNextPage
            });
        })
        .catch(err => {
            const eror = new Error(err);
            error.httpStatusCode(500);
            return next(error);
        });
};

module.exports.getProduct = (req, res, next) => {
    const productId = req.params.productId;

    Product
        .findById(productId)
        .then(product => {
            res.render('shop/product-details', {
                pageTitle: product.title,
                path: '/products',
                product: product,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));
};

module.exports.getCart = (req, res, next) => {

      if (!req.session.user) {
        return next();
    }



     User.findById(req.session.user._id)
        .populate('cart.items.productId')
        .then(user => {
            let products = [ ...user.cart.items ].map(product => {
                return { ...product.productId._doc, quantity: product.quantity };
            });
            res.render('shop/cart', {
                pageTitle: 'Cart',
                path: '/cart',
                products: products,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));
};

module.exports.postCart = (req, res, next) => {
    const productId = req.body.productId;
    req.user.addToCart(productId)
        .then(result => {
            res.redirect('/');
        })
        .catch(err => console.log(err));
};

module.exports.postDeleteCartProduct = (req, res, next) => {
    const productId = req.body.productId;
    req.user.deleteItemFromCart(productId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => console.log(err));
};

module.exports.getOrders = (req, res, next) => {

   
    Order
        .find({
            'user.userId': req.user._id
        })
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: 'Orders',
                path: '/orders',
                orders: orders,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));
};

module.exports.getCheckout = (req, res, next) => {
    res.render('shop/checkout', {
        pageTitle: 'Checkout',
        path: '/checkout',
        isAuthenticated: req.session.isLoggedIn
    });
};


module.exports.postOrder = (req, res, next) => {
    User.findById(req.session.user._id)
        .populate('cart.items.productId')
   
        .then(user => {
            const products = user.cart.items.map(item => {
                return {
                    _id: item.productId._id,
                    title: item.productId.title,
                    price: item.productId.price,
                    description: item.productId.description,
                    imageUrl: item.productId.imageUrl,
                    quantity: item.quantity
                };
            });
            const order = new Order({
                user: {
                email:req.user.email,
                userId:req.user
                },
                products: products
            });

       
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => console.log(err));
};



module.exports.getInvoice = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);
        
        if (!order) {
            return next(new Error('No order found'));
        }
        
        // 权限检查
        if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('Unauthorized access'));
        }
        
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        
        // 检查文件是否已存在
        if (fsSync.existsSync(invoicePath)) {
            // 直接发送已存在的文件
            const fileStream = fsSync.createReadStream(invoicePath);
            return fileStream.pipe(res);
        }
        
        // 创建目录（如果不存在）
        const dir = path.join('data', 'invoices');
        await fs.mkdir(dir, { recursive: true });
        
        // 创建新 PDF
        const pdfDoc = new PDFDocument();
        
        // 同时保存到文件和发送到浏览器
        pdfDoc.pipe(fsSync.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
        
        // PDF 内容
        pdfDoc.fontSize(20).text('Invoice # ' + order._id);
        pdfDoc.text('------------------------------');
        pdfDoc.fontSize(12);
        
        let index = 1;
        let totalPrice = 0;
        order.products.forEach(product => {
            let calculatedPrice = product.price * product.quantity;
            pdfDoc.text(index + '. ' + product.title + ' - ' + product.quantity + ' x $' + product.price.toFixed(2) + ' = $' + calculatedPrice.toFixed(2));
            totalPrice += calculatedPrice;
            index++;
        });
        
        pdfDoc.text('------------------------------');
        pdfDoc.fontSize(16).text('Total: $' + totalPrice.toFixed(2));
        
        pdfDoc.end();
        
    } 

       catch(err)  {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error);
        }
};