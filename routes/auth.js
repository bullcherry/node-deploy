const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

router.get('/join', isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body;

  try {
    const foundUser = await User.findOne({ where: { email } });
    if (foundUser) {
      req.flash('joinError', '이미 가입된 이메일입니다.');
      return res.redirect('/join');
    }
    const hash = await bcrypt.hash(password, 12);
    User.create({
      email,
      nick,
      password: hash,
    });
    return res.redirect('/');
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.get('/login', isNotLoggedIn, (req, res, next) => {
  passport.authentidate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      req.flash('loginError', info.message);
      return res.redirect('/');
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect('/');
    });
  })(req, res, next);
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

router.get('/kakao/callback',
  passport.authenticate('kakao', {
    failureRedirect: '/'
  }), (req, res) => {
    res.redirect('/');
  }
);

module.exports = router;