var store = require("../cn-store-js")
  , _ = require("underscore")
  , clauses = require('./search-clauses');

var recordRequest = function(req, res, next) {
  var appID = req.headers.authorization.split(' ')[1];
  var userID = req.user.id;

  var requestModel = new store.Request({appID:appID, userID:userID});
  requestModel.save();

  next();
};

/**
 * Query the datastore for an `Item` document. Allowed params are: before, 
 * after, tags, text, sources, license, lifespan, publishedAt, limit, offset, 
 * location.
 */

var itemQueryBuilder = function(dbConn) {
  return function(obj, cb) {
    var body;

    delete obj._;

    if(_(obj).isEmpty()) {
      console.log(" --------- empty! --------");
      body = {
        query: {
          "match_all" : { }
        }
      }
    }

    else {
      console.log(" --------- not! --------");
      console.log(obj);

      var filters = [];
      
      // tags
      if(obj.tags) {
        filters.push({terms: {"tags.name": obj.tags.split(",")}});
      }

      // date range
      if(obj.before || obj.after) {
        var dateFilter = {
          range: {createdAt:{}}
        };

        if(obj.before) {
          if(!obj.before.match('T')) {
            obj.before = obj.before + 'T00:00'
          }

          dateFilter.range.createdAt.lte = obj.before;
        }

        if(obj.after) {
          if(!obj.after.match('T')) {
            obj.after = obj.after + 'T00:00'
          }
          dateFilter.range.createdAt.gte = obj.after;
        }

        filters.push(dateFilter);
      }
      

      body = {
        query: {
          "filtered" : {
              /*
              "query" : {
                  "match" : { "tags" : "conflict" }
              }*/
          }
        }
      };

      if(!_(filters).isEmpty()) {
        body.query.filtered.filter = {
          and: filters
        };
      }
    }

    dbConn.search({
      index: 'item',
      type: 'item-type',
      from: 0,
      size: 25,
      body: body
    }).then(function (resp) {
        var hits = resp.hits.hits;
        var responseData = _(hits).map(function(hit) {
          var data = hit._source;
          data.id = hit._id;
          return data;
        });

        cb(null, responseData, {total: resp.hits.total});
    }, function (err) {
        cb(err);
    });
  };
};


module.exports = {
  middlewares: [recordRequest],
  queryBuilder: itemQueryBuilder
}