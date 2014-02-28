var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy
  , GitHubStrategy = require('passport-github').Strategy
  , config = require('config')
  , User = require('../cn-store-js').User
  , _ = require("underscore");


var updateUser = function(userData, done) {
  var promise = User.upsert(userData, ["authProfiles.token", "authProfiles.provider"]);
  
  promise.then(function(user) {
    done(null, user);
  }, function(err) {
    done(err);
  });
};


var handleGitHub = function(token, tokenSecret, profile, done) {
    var userData = {
    fullName: profile.displayName,
    photos: [],
    bio: profile._json.description,
    locationName: profile._json.location,
    authProfiles: [
      {
        token: token,
        provider: profile.provider,
        username: profile.username,
        remoteID: profile.id.toString()
      }
    ]
  };

  updateUser(userData, done);
};

var handleTwitter = function(token, tokenSecret, profile, done) {
  var userData = {
    fullName: profile.displayName,
    photos: (function() {
      if(profile.photos) {
        return _.map(profile.photos, function(obj) { return obj.value });
      }

      return [];
    })(),
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

  updateUser(userData, done);
};


var setupProviders = function() {
  // Twitter
  passport.use(new TwitterStrategy({
      consumerKey: config.twitter.consumerKey,
      consumerSecret: config.twitter.consumerSecret,
      callbackURL: config.baseURL + "/auth/twitter/callback"
    }, handleTwitter
  ));

  // GitHub
  passport.use(new GitHubStrategy({
      clientID: config.github.clientToken,
      clientSecret: config.github.clientSecret,
      callbackURL: config.baseURL + "/auth/github/callback"
    }, handleGitHub
  ));
};

module.exports = {
  setupProviders: setupProviders,
  handleTwitter: handleTwitter,
  handleGitHub: handleGitHub
};