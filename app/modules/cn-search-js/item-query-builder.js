var store = require("../cn-store-js")
  , _ = require("underscore")
  , clauses = require('./clauses');


/**
 * Query the datastore for an `Item` document. Allowed params are: before, 
 * after, tags, text, sources, license, lifespan, publishedAt, limit, offset, 
 * location.
 */

var itemQueryBuilder = function(obj, cb) {
  var params = {};

  // before, after
  _.extend(params, clauses.addDateClause("publishedAt", obj.before, obj.after));

  // tags
  _.extend(params, clauses.addInClause("tags.name", obj.tags));

  // text 
  _.extend(params, clauses.addSearchClause("content", obj.text));
  
  // sources
  _.extend(params, clauses.addInClause("source", obj.sources));
  
  // licenses
  _.extend(params, clauses.addInClause("license", obj.license));
  
  // lifespan
  _.extend(params, clauses.addInClause("lifespan", obj.lifespan));

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
    // Not available until 2.6, current stable is 2.4.9
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

  find.exec(function(err, results) {
    /*
    store.Item.count(params, function(err, count) {
      cb(err, results, {total: count});
    });
    */
    cb(err, results, {total: results.length});
  });
    
};

module.exports = itemQueryBuilder;