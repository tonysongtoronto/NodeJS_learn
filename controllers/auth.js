 //const cookies = require('../util/cookie');
 const bcrypt = require('bcryptjs');

 const nodemailer = require('nodemailer');


const sendgridTransport = require('nodemailer-sendgrid-transport'); // this doesn't work as i haven't been able to create an sendgrid account



const User = require('../models/user');

module.exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if(message.length <= 0) message = null;

    let errorMessage = null;
    if(message && message.length > 0) {
        errorMessage = message;
    }
    
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
           errorMessage: errorMessage,
          isAuthenticated: false
    });
};

module.exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
 
    User
        .findOne({
            email: email
        })
        .then(user => {
            if(user) {
                bcrypt
                    .compare(password, user.password)
                    .then(matched => {
                        if(matched) {
                            req.session.user = user;
                            req.session.isLoggedIn = true;
                            req.session.save(err => {
                                if(err) console.log(err);
                                res.redirect('/');
                            });
                        } else {
                            req.flash('error', 'Password did not match');
                            res.redirect('/login');
                        }
                    }).catch(err => {
                        if(err) console.log(err);
                        req.flash('error', 'Sorry, there was some problem...');
                        res.redirect('/login');
                    });
            } else {
                req.flash('error', 'Invalid email or password');
                res.redirect('/login');
            }
        })
        .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      console.log('Error destroying session:', err);
      return next(err);
    }
    console.log('Session destroyed successfully');
    res.redirect('/login');  // 直接重定向到登录页
  });
};


module.exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if(message.length <= 0) message = null;
    res.render('auth/signup', {
        pageTitle: 'Signup',
        path: '/signup',
        errorMessage: message,
        isAuthenticated: false
    });
};


module.exports.postSignup = (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

         User
        .findOne({
            email: email
        })
        .then(user => {
            if(user) {
                req.flash('error', 'Email already exists, please use another email');
                return res.redirect('/signup');
            } else {
                bcrypt
                    .hash(password, 12)
                    .then(hashedPassword => {
                        const newUser = new User({
                            username: username,
                            email: email,
                            password: hashedPassword,
                            cart: { items: [] }
                        });
                    
                        return newUser.save();
                    })
                    .then(result => {
                
               
                                            
                    }).then(info => {
                    console.log("*****************");
                    console.log('邮件发送成功！');
              
                    console.log('收件人:', email);
                    console.log("*****************");
                    res.redirect('/login');
                })
                    .catch(err => console.log(err));
            }

        })
        .catch(err => console.log(err));
}