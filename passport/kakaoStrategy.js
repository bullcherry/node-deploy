const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const { User } = require('../models');

module.exports = () => {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID,
    callbackURL: '/auth/kakao/callback',    
  }, async (accessToken, refreshToken, profile, done) => {
    console.log('kakao profile: ', profile);
    try {
      const foundUser = await User.findOne(
        { where: { snsId: profile.id, provider: 'kakao' } }
      );
  
      if (foundUser) {
        done(null, foundUser);
      } else {
        const newUser = User.create({
          email: profile._json && profile._json.kaccount_email,
          nick: profile.displayName,
          snsId: profile.id,
          provider: 'kakao',
        });
        done(null, foundUser);
      }
    } catch (err) {
      console.error(err);
      done(err);
    }
  }));
};