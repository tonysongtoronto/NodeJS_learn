const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);


const csrf = require('csurf');
const flash = require('connect-flash');

const csrfProtection = csrf();


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


 app.use(csrfProtection);
app.use(flash());




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
        .catch(err => console.log(err));
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorsController.get404);


mongoose
    .connect(envKeys.MONGODB_URI, {

  dbName: 'myshop'
})
.then(result => {
   
        app.listen(envKeys.PORT);
    })
    .catch(err => console.log(err));
