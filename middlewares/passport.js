const LocalStrategy = require('passport-local').Strategy;
const Owner = require('../Models/owner-model');

module.exports = (passport) => {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const owner = await Owner.findOne({ email });
        if (!owner) {
          return done(null, false, { message: 'No owner found with this email.' });
        }

        const isMatch = await owner.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password.' });
        }

        return done(null, owner);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((owner, done) => {
    done(null, owner.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const owner = await Owner.findById(id);
      done(null, owner);
    } catch (error) {
      done(error);
    }
  });
};
