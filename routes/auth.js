const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body;

  try {
    const foundUser = await User.findOne({ where: { email } });
    if (foundUser) {      
      return res.redirect('/join?error=exist');
    }
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      nick,
      password: hash,
    });

    authenticate(req, res, next);
    // return res.redirect('/');    
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
  authenticate(req, res, next);
});

router.get('/logout', isLoggedIn, (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy();
    res.redirect('/');
  });
});

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
    failureRedirect: '/'
  }), (req, res) => {
    res.redirect('/');
});

function authenticate(req, res, next) {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {      
      console.log('info message: ', info.message);
      return res.redirect(`/?error=${info.message}`);
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect('/');
    });
  })(req, res, next);
}

module.exports = router;