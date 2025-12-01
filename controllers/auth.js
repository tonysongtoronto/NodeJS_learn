 //const cookies = require('../util/cookie');
 const bcrypt = require('bcryptjs');
 const crypto = require('crypto');
 const envKeys = require('../keys');



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
                 
                    res.redirect('/login');
                })
                    .catch(err => console.log(err));
            }

        })
        .catch(err => console.log(err));
}


module.exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
    res.render('auth/reset-password', {
        pageTitle: 'Reset Password',
        path: '/reset',
        errorMessage: message
    })
};

module.exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User
            .findOne({ email: req.body.email })
            .then(user => {
                if(!user) {
                    req.flash('error', 'No account with that email found.');
                    res.redirect('/reset');
                    return null;
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + (60 * 60 * 1000);
                return user.save();
            })
            .then(result => {
                if(result) {
                    
         res.render('auth/new-password', {
                        pageTitle: 'New Password',
                        path: '/new-password',
                        errorMessage: null,
                        successMessage: 'Please enter your new password.',
                        resetToken: token,
                        userId: result._id.toString(),
                        csrfToken: req.csrfToken()
                    });
                }
            })
             .catch(err => {
                console.log(err);
                req.flash('error', 'Something went wrong.');
                res.redirect('/reset');
            });
    });
};

module.exports.getNewPassword = (req, res, next) => {
    const token = req.params.resetToken;
    User
        .findOne({
            resetToken: token,
            resetTokenExpiration: { $gt: Date.now() }
        })
        .then(user => {
            if(user) {
                let message = req.flash('error');
                if(message.length === 0) message = null;
                res.render('auth/new-password', {
                    pageTitle: 'New Password',
                    path: '/new-password',
                    errorMessage: message,
                    resetToken: token,
                    userId: user._id.toString()
                });
            } else {
                req.flash('error', 'Something went wrong. Please try again later.');
                res.redirect('/login');
            }
        })
        .catch(err => console.log(err));
};

module.exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const resetToken = req.body.resetToken;

    if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match. Please try again.');
        return res.redirect(`/reset/${resetToken}`);
    }
    User
        .findOne({
            _id: userId,
            resetToken: resetToken,
            resetTokenExpiration: { $gt: Date.now() }
        })
        .then(user => {
            if(user) {
                bcrypt
                    .hash(password, 12)
                    .then(hashedPassword => {
                        user.password = hashedPassword;
                        user.resetToken = null;
                        user.resetTokenExpiration = undefined;
                        return user.save();
                    })
                    .then(result => {

                        req.flash('error', `Your password has been reset successfully at ${new Date(Date.now()).toString()}`);
                        res.redirect('/login');
                    })
                    .catch(err => console.log(err));
            }
        })
        .catch(err => console.log(err));
};
