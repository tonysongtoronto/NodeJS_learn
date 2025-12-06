const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const csrf = require('csurf');
const flash = require('connect-flash');
const csrfProtection = csrf();
const multer = require('multer');
const crypto = require('crypto');



const fileStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images');
    },
    filename: (req, file, callback) => {
        crypto.randomBytes(20, (err, buffer) => {
            const name = Date.now() + buffer.toString('hex') + '.' + file.originalname.split('.').reverse()[0];
            callback(null, name);
        });
    }
});

const fileFilter = (req, file, callback) => {
    const fileTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    if(fileTypes.includes(file.mimetype)) {
        // ✅ 接受文件：第一个参数 null（无错误），第二个参数 true（接受）
        callback(null, true);
    } else {
        // ✅ 拒绝文件：传递 Error 对象
        callback(new Error('只允许上传 PNG, JPG, JPEG 格式的图片！'));
        // 或者如果你想静默拒绝（不抛出错误），可以用：
        // callback(null, false);
    }
};
const app = express();

const envKeys = require('./keys');

const store = new MongoDBStore({
    uri: "mongodb+srv://junfengs_db_user:QMmyjH3dL6RjU7q8@cluster0.ejjlifu.mongodb.net/myshop",
    collection: 'sessions'
});

const errorsController = require('./controllers/errors.js');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/server.js');


// Models
const User = require('./models/user');

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    // secret: envKeys.SESSION_SECRET_KEY,
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.use(flash());

app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
 app.use(csrfProtection);


app.use((req, res, next) => {
    if(!req.session.user) return next();
    User
        .findById(req.session.user._id)
        .then(user => {
            if(user) {
                req.user = user;
                next();
            } else {
                res.redirect('/login');
            }
        })
          .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});



app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(serverRoutes);


app.use(errorsController.get404);



app.use((error, req, res, next) => {
 
    
    // 如果是文件类型错误，使用 flash 消息并重定向
    if (error.message && error.message.includes('只允许上传')) {
        req.flash('error', error.message);
          
        return req.session.save(err => {
            if (err) console.error('Error saving session:', err);
            // 重定向到上一个页面，通常是添加/编辑产品的页面
            res.redirect('/admin/products');
        });
    }
    
    // 其他服务器错误
    res.status(500).render('500', { 
        pageTitle: 'Error!', 
        path: '/500',
        isAuthenticated: res.locals.isAuthenticated || false
    });
});

mongoose
    .connect(envKeys.MONGODB_URI, {

  dbName: 'myshop'
})
.then(result => {
   
        app.listen(envKeys.PORT);
    })
    .catch(err => console.log(err));
