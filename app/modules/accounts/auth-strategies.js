var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy
  , config = require('config')
  , User = require('../cn-store-js').User;


var handleTwitter = function(token, tokenSecret, profile, done) {
  console.log(token);
  console.log(tokenSecret);
  console.log(profile);

  /*
  User.findOrCreate(..., function(err, user) {
    if (err) { return done(err); }
    done(null, user);
  });
  */

  done();
};


var setupProviders = function() {
  passport.use(new TwitterStrategy({
      consumerKey: config.twitter.consumerKey,
      consumerSecret: config.twitter.consumerSecret,
      callbackURL: config.baseURL + "/auth/twitter/callback"
    }, handleTwitter
  ));
};

module.exports = {
  setupProviders: setupProviders,
  handleTwitter: handleTwitter
};