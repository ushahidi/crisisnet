var store = require("../cn-store-js")
  , _ = require("underscore");


var addClause = function(key, str, f) { 
  var obj = {};
  if(!_(str).isUndefined()) obj[key] = f();
  return obj;
};

var addInClause = function(key, str) {
  return addClause(key, str, function() { return { "$in": str.split(",") }});
};

// @TODO This is a placeholder and obviously not for production use.
var addSearchClause = function(key, str) {
  return addClause(key, str, function() { return new RegExp(str, 'i'); });
};

var addDateClause = function(key, before, after) {
  var str = (function() {
    if(before) return before;
    if(after) return after;

    return undefined;
  })();

  return addClause(key, str, function() { 
    var paramObj = {};

    if(before) {
      paramObj["$lt"] = (new Date(before)).toISOString();
    }

    if(after) {
      paramObj["$gte"] = (new Date(after)).toISOString();
    }
    
    return paramObj;
  });

};

var queryBuilder = function(obj, cb) {
  var params = {};

  // before, after
  _.extend(params, addDateClause("publishedAt", obj.before, obj.after));

  // tags
  _.extend(params, addInClause("tags", obj.tags));

  // text 
  _.extend(params, addSearchClause("content", obj.text));
  
  // sources
  _.extend(params, addInClause("source", obj.sources));
  
  // licenses
  _.extend(params, addInClause("license", obj.license));
  
  // lifespan
  _.extend(params, addInClause("lifespan", obj.lifespan));

  // orderBy
  var sort = { publishedAt: -1 };

  // limit
  var limit = obj.limit || 25;
  
  // offset
  var offset = obj.offset || 0;

  /**
   * Geospatial queries are performed using an aggregate pipeline, which 
   * uses the MongoDB driver to apply a series of transformations (like limit
   * and skip) to the result set. Note that this returns raw documents and not 
   * `mongoose.Model` objects.
   */

  var find;
  if(obj.location) {
    var coords = obj.location.split(",").map(parseFloat);
    var geoNear = {
      near: coords,
      query: params,
      limit: 50,
      spherical: true,
      maxDistance: 20 / 6371,
      distanceField: 'distance',
      includeLocs: 'geo.coords'
    };

    // Prefer minDistance
    // http://emptysqua.re/blog/paging-geo-mongodb/
    // Not available until 2.5, current stable is 2.4.9
    if(_(obj).has('minDistance')) {
      geoNear.minDistance = obj.minDistance;
    }

    var aggregatePipeline = [
      { '$geoNear': geoNear },
      { '$limit': limit }
    ];

    // If you really must, we'll let you skip records for now
    //if(obj.offset && !_(geoNear).has('minDistance')) {
    if(obj.offset) {
      aggregatePipeline.push({ '$skip': offset });
    }

    find = store.Item.aggregate(aggregatePipeline);
  }

  else {
    find = store.Item.find(params)
      .limit(limit)
      .skip(offset)
      .sort(sort);
  }

  find.exec(cb);
    
};

module.exports = queryBuilder;