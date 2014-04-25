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
      body = {
        query: {
          "match_all" : { }
        }
      }
    }

    else {
      body = {
        query: {
          filtered: {}
        }
      };

      var filters = [];
      
      // tags
      if(obj.tags) {
        filters.push({in: {"tags.name": obj.tags.split(",")}});
      }

      // sources
      if(obj.sources) {
        filters.push({in: {source: obj.sources.split(",")}});
      }

      // license
      if(obj.license) {
        filters.push({term: {license: obj.license}});
      }

      // lifespan
      if(obj.lifespan) {
        filters.push({term: {lifespan: obj.lifespan}});
      }

      // date range
      if(obj.before || obj.after) {
        var dateFilter = {
          range: {publishedAt:{}}
        };

        if(obj.before) {
          if(!obj.before.match('T')) {
            obj.before = obj.before + 'T00:00'
          }

          dateFilter.range.publishedAt.lte = obj.before;
        }

        if(obj.after) {
          if(!obj.after.match('T')) {
            obj.after = obj.after + 'T00:00'
          }
          dateFilter.range.publishedAt.gte = obj.after;
        }

        filters.push(dateFilter);
      }

      // location
      if(obj.location) {
        geoFilter = {
            geo_distance: {
              distance: (obj.distance || 200).toString() + "km",
              "geo.coords" : _(obj.location.split(",").reverse()).map(parseFloat)
            }
        }
        
        filters.push(geoFilter);
      }

      if(!_(filters).isEmpty()) {
        body.query.filtered.filter = {
          and: filters
        };
      }

      // limit
      var limit = obj.limit || 25;

      if(limit > 500) {
        limit = 500;
      }
      
      // offset
      var offset = obj.offset || 0;

      
      // free text
      if(obj.text) {
        body.query.filtered.query = {
          multi_match: { 
            query: obj.text,
            fields: ["summary", "content"]
          }
        }
      }
    
    }

    dbConn.search({
      index: 'item',
      type: 'item-type',
      from: offset,
      size: limit,
      body: body
    }).then(function (resp) {
        var hits = resp.hits.hits;
        var responseData = _(hits).map(function(hit) {
          var data = hit._source;
          data.id = hit._id;
          if(data.geo.coords) {
            data.geo.coords = data.geo.coords.reverse()
          }

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