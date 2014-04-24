var store = require("../cn-store-js")
  , _ = require("underscore")
  , clauses = require('./clauses');


/**
 * Query the datastore for an `Request` document. Allowed params are: createdAt, 
 * appID, userID. 
 */

var requestQueryBuilder = function(obj, cb) {
  var params = {};

  _.extend(params, clauses.addIsClause("sourceType", obj.sourceType));

  // orderBy
  var sort = { createdAt: -1 };

  // limit
  var limit = obj.limit || 25;
  
  // offset
  var offset = obj.offset || 0;
 
  find = store.Source.find(params)
    .limit(limit)
    .skip(offset)
    .sort(sort);

  find.exec(function(err, results) {
    store.Source.count(params, function(err, count) {
      cb(err, results, {total: count});
    });
  });
    
};

module.exports = requestQueryBuilder;