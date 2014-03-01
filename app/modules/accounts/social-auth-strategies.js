var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy
  , GitHubStrategy = require('passport-github').Strategy
  , config = require('config')
  , User = require('../cn-store-js').User
  , _ = require("underscore");


var updateUser = function(req, userData, done) {
  var saveAndLogin = function(newUser) {
    newUser.saveP().then(
      function(user) { done(null, user); },
      function(err) { done(err); }
    );
  };

  // if the user is already logged in
  if(req.user) {
    // check to see if a profile from this source already exists
    var authProfile = _(req.user.authProfiles).findWhere({
      remoteID: userData.authProfile.remoteID,
      provider: userData.authProfile.provider
    });

    // even if the profile is from a provider that the user has already 
    // authorized, it may be a separate account on that service that s/he
    // also owns.
    if(!authProfile) {
      req.user.authProfiles.push(userData.authProfile);
    }

    // append any new photos from the oauth provider to the user's photos
    req.user.photos = _.union(req.user.photos, userData.photos);

    // save the user and we're done
    saveAndLogin(req.user);
  }
  else {
    User.findOne({
      'authProfiles.provider': userData.authProfile.provider,
      'authProfiles.remoteID': userData.authProfile.remoteID
    }, function(err, user) {
      if(err) return done(err);

      // If this user exists, then great - log them in and move on
      if(user) return done(null, user);

      userData.authProfiles = [userData.authProfile];
      delete userData.authProfile;
      var newUser = new User(userData);

      saveAndLogin(newUser);
    });

  };
};


var handleGitHub = function(req, token, tokenSecret, profile, done) {
  var userData = {
    fullName: profile.displayName,
    photos: [],
    bio: profile._json.bio,
    locationName: profile._json.location,
    authProfile: {
      token: token,
      provider: profile.provider,
      username: profile.username,
      remoteID: profile.id.toString()
    }
  };

  updateUser(req, userData, done);
};

var handleTwitter = function(req, token, tokenSecret, profile, done) {
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
    authProfile: {
      token: token,
      secret: tokenSecret,
      provider: profile.provider,
      username: profile.username,
      remoteID: profile.id.toString()
    } 
  };

  updateUser(req, userData, done);
};


var setupProviders = function() {
  // Twitter
  passport.use(new TwitterStrategy({
      consumerKey: config.twitter.consumerKey,
      consumerSecret: config.twitter.consumerSecret,
      callbackURL: config.baseURL + "/auth/twitter/callback",
      passReqToCallback: true
    }, handleTwitter
  ));

  // GitHub
  passport.use(new GitHubStrategy({
      clientID: config.github.clientToken,
      clientSecret: config.github.clientSecret,
      callbackURL: config.baseURL + "/auth/github/callback",
      passReqToCallback: true
    }, handleGitHub
  ));
};

module.exports = {
  setupProviders: setupProviders,
  handleTwitter: handleTwitter,
  handleGitHub: handleGitHub
};