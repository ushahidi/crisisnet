var chai = require('chai');
chai.should();
var config = require('config')
  , _ = require("underscore")
  , expect = chai.expect
  , assert = chai.assert
  , mongoose = require('mongoose')
  , clearDB  = require('mocha-mongoose')(config.dbURI)
  , store = require('../app/modules/cn-store-js')
  , strategies = require('../app/modules/accounts/auth-strategies');

describe('auth handlers', function(){
  beforeEach(function(done) {
    if (mongoose.connection.db) return done();

    mongoose.connect(config.dbURI, done);
  });

  /*
  it('should get some data', function(done) {
    this.timeout(5000);
    var fb = new Facebook();
    fb.suck();
  });
  */

  describe('twitter auth', function() {
    it('should transform data to the correct format', function(){
      // Don't really read files like this. I'm only doing it here because it's 
      // a unit test, where we can revel in questionable coding practices. 
      var twitterProfile = require('./data/twitter-auth-response.json');
      strategies.handleTwitter("test", "test", twitterProfile, function(err, user) {
        assert.isNull(err);
        assert.isDefined(user.createdAt);
        assert(user.fullName === "Jonathon Morgan");
        assert(user.authProfiles.length === 1);
      });
    });
  });
})