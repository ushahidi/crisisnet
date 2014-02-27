var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy
  , config = require('config')
  , User = require('../cn-store-js').User;


var handleTwitter = function(token, tokenSecret, profile, done) {
  var userData = {
    fullName: profile.displayName,
    photos: (function() {
      if(profile.photos) {
        return _.map(profile.photos, function(obj) { return obj.value });
      }

      return [];
    }),
    bio: profile._json.description,
    locationName: profile._json.location,
    authProfiles: [
      {
        token: token,
        secret: tokenSecret,
        provider: profile.provider,
        username: profile.username,
        remoteID: profile.id.toString()
      }
    ]
  };

  var promise = User.upsert(userData, ["authProfiles.token", "authProfiles.provider"]);
  
  promise.then(function(user) {
    done(null, user);
  }, function(err) {
    done(err);
  });
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