var store = require("../cn-store-js")
  , _ = require("underscore")
  , clauses = require('./search-clauses');

var recordRequest = function(req, res, next) {
  var appID;
  if(req.headers.authorization) {
    appID = req.headers.authorization.split(' ')[1];
  }
  else if(req.params.apikey) {
    appID = req.params.apikey;
  }
  else {
    return next();
  }

  var userID = req.user.id;

  var requestModel = new store.Request({
    appID:appID, 
    userID:userID,
    requestedResource:req.originalUrl
  });
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

    else if(obj.rawQuery) {
      body = obj.rawQuery;
    }

    else {
      body = {
        query: {
          filtered: {}
        }
      };

      var filters = [];

      if(obj.ids) {
        filters.push({in: {"_id": obj.ids.split(",")}});
      }
      
      // tags
      if(obj.tags) {
        filters.push({in: {"tags.name": obj.tags.split(",")}});
      }

      // author
      if(obj.authorID) {
        filters.push({term: {"author.remoteID": obj.authorID}});
      }
      if(obj.authorName) {
        filters.push({term: {"author.name": obj.authorName}});
      }

      // sources
      if(obj.sources) {
        filters.push({in: {source: obj.sources.split(",")}});
      }

      // licenses
      if(obj.licenses) {
        filters.push({in: {source: obj.licenses.split(",")}});
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
              "geo.coords" : _(obj.location.split(",")).map(parseFloat)
            }
        }

        filters.push(geoFilter);
      }


      // check all the admins for this place name
      if(obj.placeName) {
        var placeName = obj.placeName.toLowerCase()
        var or = [
            "adminArea1",
            "adminArea2",
            "adminArea3",
            "adminArea4",
            "adminArea5"
          ].map(function(adminArea) {
            var termObj = {
              term: {}
            };
            termObj.term["geo.addressComponents."+adminArea] = placeName;
            return termObj;
        });

        filters.push({
          or: or
        });

      }

      // make sure image property has been set
      if(obj.hasPhoto) {
        filters.push({
          "exists" : { "field" : "image" }
        });
      }

      // make sure video property has been set
      if(obj.hasVideo) {
        filters.push({
          "exists" : { "field" : "video" }
        });
      }

      // make sure image property has been set
      if(obj.hasGeo) {
        filters.push({
          "exists" : { "field" : "geo.coords" }
        });
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
      /*
      var searchText = obj.text.split(',').join(' ');
      if(_.isArray(searchText)) {
        searchText = obj.text.join(' ');
      }
      */
      if(obj.text) {
        body.query.filtered.query = {
          match: { 
            searchText: {
              query: obj.text,
              operator: 'and'
            }
          }
        }
      }
    
    }

    var sortObj = {};
    var sortField = obj.sortBy || "publishedAt";
    sortObj[sortField] = {
      order: obj.sortDirection || "desc",
      missing: "_last", 
      ignore_unmapped: true
    }
    body.sort = [sortObj];

    dbConn.search({
      index: 'item_alias',
      type: 'item-type',
      from: offset,
      size: limit,
      body: body
    }).then(function (resp) {
        var responseData;

        if(obj.countOnly) {
          responseData = [];
        }
        else {
          var hits = resp.hits.hits;
          responseData = _(hits).map(function(hit) {
            var data = hit._source;
            data.id = hit._id;

            delete data.searchText;

            return data;
          });
        }

        

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