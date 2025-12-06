module.exports = (req, res, next) => {
  console.log('=== isAuth Middleware ===');
  console.log('req.session:', req.session);
  console.log('req.session.user:', req.session?.user);
  console.log('req.session.isLoggedIn:', req.session?.isLoggedIn);
  
  if (!req.session || !req.session.user) {
    console.log('❌ No user in session, redirecting to login');
    return res.redirect('/login');
  }
 
  console.log('✅ User authenticated, proceeding');
  next();
};