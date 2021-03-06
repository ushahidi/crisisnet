var chai = require('chai');
chai.should();
var config = require('config')
  , _ = require("underscore")
  , expect = chai.expect
  , assert = chai.assert
  , mongoose = require('mongoose')
  , clearDB  = require('mocha-mongoose')(config.dbURI)
  , store = require('../app/modules/cn-store-js')
  , strategies = require('../app/modules/accounts/social-auth-strategies');

describe('auth handlers', function(){
  beforeEach(function(done) {
    if (mongoose.connection.db) return done();

    mongoose.connect(config.dbURI, done);
  });

  describe('twitter auth', function() {
    it('should transform data to the correct format', function(done){
      // Don't really read files like this. I'm only doing it here because it's 
      // a unit test, where we can revel in questionable coding practices. 
      var twitterProfile = require('./data/twitter-auth-response.json');
      strategies.handleTwitter({}, "test", "test", twitterProfile, function(err, user) {
        assert.isNull(err);
        assert.isDefined(user.createdAt);
        assert(user.fullName === "Jonathon Morgan");
        assert(user.authProfiles.length === 1);
        done();
      });
    });
  });

  describe('github auth', function() {
    it('should trasform data to the correct format', function(done) {
      var githubProfile = require('./data/github-auth-response.json');
      strategies.handleGitHub({}, "test", undefined, githubProfile, function(err, user) {
        assert.isNull(err);
        assert.isDefined(user.createdAt);
        assert(user.fullName === "Jonathon Morgan");
        assert(user.authProfiles.length === 1);
        done();
      });
    });
  });

  describe('in general', function() {
    it('should upsert a user who we already know', function(done) {
      var twitterProfile = require('./data/twitter-auth-response.json');
      strategies.handleTwitter({}, "test", "test", twitterProfile, function(err, user) {
        assert.isNull(err);
        assert.isDefined(user.createdAt);
        assert(user.fullName === "Jonathon Morgan");
        assert(user.authProfiles.length === 1);

        strategies.handleTwitter({}, "test", "test", twitterProfile, function(err, user) {
          assert.isNull(err);
          assert(user.photos.length === 1);

          store.User.find(function(err, users) {
            assert(users.length === 1);
            done();
          });
        });
      });
    });

    it('should add a new user we do not know', function(done) {
      var twitterProfile = require('./data/twitter-auth-response.json');
      strategies.handleTwitter({}, "test", "test", twitterProfile, function(err, user) {
        assert.isNull(err);
        assert.isDefined(user.createdAt);
        assert(user.fullName === "Jonathon Morgan");
        assert(user.authProfiles.length === 1);

        twitterProfile.id = "lkafjsdlfkjasdlkf";
        strategies.handleTwitter({}, "test", "test", twitterProfile, function(err, user) {
          assert.isNull(err);

          store.User.find(function(err, users) {
            assert(users.length === 2);
            done();
          });
        });
      });
    });

    it('should not add a new profile if the passed user already has it', function(done) {
      var twitterProfile = require('./data/twitter-auth-response.json');
      strategies.handleTwitter({}, "test", "test", twitterProfile, function(err, user) {
        assert.isNull(err);
        assert.isDefined(user.createdAt);
        assert(user.fullName === "Jonathon Morgan");
        assert(user.authProfiles.length === 1);

        strategies.handleTwitter({user: user}, "test", "test", twitterProfile, function(err, user) {
          assert.isNull(err);

          store.User.find(function(err, users) {
            assert(users.length === 1);
            done();
          });
        });
      });
    });

    it('should add a new profile if the passed user does not have it', function(done) {
      var twitterProfile = require('./data/twitter-auth-response.json');
      strategies.handleTwitter({}, "test", "test", twitterProfile, function(err, user) {
        assert.isNull(err);
        assert.isDefined(user.createdAt);
        assert(user.fullName === "Jonathon Morgan");
        assert(user.authProfiles.length === 1);


        twitterProfile.id = "asldjflaskdjf";
        strategies.handleTwitter({user: user}, "test", "test", twitterProfile, function(err, user) {
          assert.isNull(err);

          assert(user.authProfiles.length === 2);

          store.User.find(function(err, users) {
            assert(users.length === 1);
            done();
          });
        });
      });
    });

  });
})