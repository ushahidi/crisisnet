var chai = require('chai');
chai.should();
var config = require('config')
  , _ = require("underscore")
  , expect = chai.expect
  , assert = chai.assert
  , mongoose = require('mongoose')
  , clearDB  = require('mocha-mongoose')(config.dbURI)
  , store = require('../app/modules/cn-store-js')
  , search = require('../app/modules/cn-search-js')
  , moment = require("moment");

describe('search', function(){
  beforeEach(function(done) {
    if (mongoose.connection.db) return done();
    mongoose.connect(config.dbURI, done);
  });

  it('should return the correct count', function(done) {
    var users = [
      {
        apps: [
          {name: "App1"},
          {name: "App2"}
        ]
      },
      {
        apps: [
          {name: "App3"}
        ]
      }
    ];

    store.User.saveList(users).then(function(users) {
      assert(users.length === 2);
      // filter for weather
      search.appQueryBuilder({}, function(err, results, meta) {
        assert(results.length === 3);
        assert(meta.total === 3);
        done();
      });
    }, function(err) {
      done(err);
    });
  });

})