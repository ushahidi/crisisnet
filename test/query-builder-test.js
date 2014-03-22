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

  it('should filter by tag', function(done) {
    var items = [
      {
        tags: [{name:'weather'}, {name:'hurricane'}],
        remoteID: 1,
        source: "twitter"
      },
      {
        tags: [{name:'weather'}, {name:'storm'}],
        remoteID: 2,
        source: "twitter"
      },
      {
        tags: [{name:'storm'}],
        remoteID: 3,
        source: "twitter"
      }
    ];

    store.Item.saveList(items).then(function(items) {
      assert(items.length === 3);
      // filter for weather
      search.queryBuilder({tags: 'weather'}, function(err, results) {
        assert(results.length===2);
        done();
      });
    }, function(err) {
      done(err);
    });
  });

  it('should filter by date', function(done) {
    var items = [
      {
        remoteID: 1,
        source: "twitter",
        publishedAt: new Date()
      },
      {
        remoteID: 2,
        source: "twitter",
        publishedAt: new Date()
      },
      {
        remoteID: 3,
        source: "twitter",
        publishedAt: moment().subtract('days', 1)
      },
      {
        remoteID: 3,
        source: "twitter",
        publishedAt: moment().add('days', 1)
      }
    ];

    store.Item.saveList(items).then(function(items) {
      assert(items.length === 4);
      // filter for weather
      search.queryBuilder({before: Date.now()}, function(err, results) {
        assert.isNull(err);
        assert(results.length===3);

        search.queryBuilder({after: Date.now()}, function(err, results) {
          assert.isNull(err);
          assert(results.length===1);

          search.queryBuilder({
              after: moment().format("YYYY-MM-DD"),
              before: moment().add('days', 1).format("YYYY-MM-DD")
            }, function(err, results) {
              assert(results.length===2);
              done();
          });
        });
      });
    }, function(err) {
      done(err);
    });
  });


  it('should filter by license', function(done) {
    var items = [
      {
        remoteID: 1,
        source: "twitter",
        license: "unknown"
      },
      {
        remoteID: 2,
        source: "twitter",
        license: "odbl"
      },
      {
        remoteID: 3,
        source: "twitter",
        license: "commercial"
      }
    ];

    store.Item.saveList(items).then(function(items) {
      assert(items.length === 3);
      // filter for weather
      search.queryBuilder({license: 'odbl,commercial'}, function(err, results) {
        assert(results.length===2);
        done();
      });
    }, function(err) {
      done(err);
    });
  });


  it('should filter by lifespan', function(done) {
    var items = [
      {
        remoteID: 1,
        source: "twitter",
        license: "unknown",
        lifespan: "temporary"
      },
      {
        remoteID: 2,
        source: "twitter",
        license: "odbl",
        lifespan: "permanent"
      },
      {
        remoteID: 3,
        source: "twitter",
        license: "commercial",
        lifespan: "permanent"
      }
    ];

    store.Item.saveList(items).then(function(items) {
      assert(items.length === 3);
      // filter for weather
      search.queryBuilder({lifespan: 'temporary'}, function(err, results) {
        assert(results.length===1);
        done();
      });
    }, function(err) {
      done(err);
    });
  });


  it('should filter by coords', function(done) {
    var items = [
      {
        tags: [{name: "not-storm"}],
        remoteID: 1,
        source: "twitter",
        license: "unknown",
        lifespan: "temporary",
        // downtown austin
        geo: {
          coords: [-97.744826, 30.263992]
        }
      },
      {
        tags: [{name: "storm"}],
        remoteID: 2,
        source: "twitter",
        license: "odbl",
        lifespan: "permanent",
        // downtown austin
        geo: {
          coords: [-97.740345, 30.274703]
        }
      },
      {
        tags: [{name: "not-storm"}],
        remoteID: 5,
        source: "twitter",
        license: "unknown",
        lifespan: "temporary",
        // downtown austin
        geo: {
          coords: [-97.744826, 30.263992]
        }
      },
      {
        tags: [{name: "storm"}],
        remoteID: 6,
        source: "twitter",
        license: "odbl",
        lifespan: "permanent",
        // downtown austin
        geo: {
          coords: [-97.740345, 30.274703]
        }
      },
      {
        remoteID: 3,
        source: "twitter",
        license: "commercial",
        lifespan: "permanent",
        // houston
        geo: {
          coords: [-95.369390, 29.760193]
        }
      }
    ];

    store.Item.saveList(items).then(function(items) {
      assert(items.length === 5);
      console.log("length is 5");
      
      // filter for locations in austin
      search.queryBuilder({location: '-97.743644, 30.272922'}, function(err, results) {
        assert.isNull(err);
        assert(results.length===4);
        console.log("length is 4");
        
        // apply tags just to make sure we can filter by query params 
        // as well as location
        search.queryBuilder({
            location: '-97.743644, 30.272922',
            tags: 'storm'
          }, function(err, results) {
            assert.isNull(err);
            assert(results.length===2);
            console.log("length is 2");
            
            // Make sure limit works
            search.queryBuilder({
                location: '-97.743644, 30.272922',
                limit: 2
              }, function(err, results) {
                assert.isNull(err);
                assert(results.length===2);

                var remoteIDs = _(results).pluck('remoteID')
                  // these are two closest records to the passed coordinates
                  , expectedIDs = ['2', '6'];

                assert(_.difference(remoteIDs, expectedIDs).length === 0);
                
                // Make sure offset works
                search.queryBuilder({
                    location: '-97.743644, 30.272922',
                    offset: 2
                  }, function(err, results) {
                    assert.isNull(err);
                    assert(results.length===2);

                    var remoteIDs = _(results).pluck('remoteID')
                      , expectedIDs = ['5', '1'];

                    assert(_.difference(remoteIDs, expectedIDs).length === 0);
                    done();
                    // Make sure minDistance works
                    /*
                    search.queryBuilder({
                        location: '-97.743644, 30.272922',
                        minDistance: 0.00015687249357503199
                      }, function(err, results) {
                        console.log(results);
                        assert.isNull(err);
                        assert(results.length===2);

                        var remoteIDs = _(results).pluck('remoteID')
                          , expectedIDs = ['5', '1'];

                        assert(_.difference(remoteIDs, expectedIDs).length === 0);
                        
                        done();
                    });
                    */

                });
                
            });
        });

      });
    }, function(err) {
      done(err);
    });
  });

})