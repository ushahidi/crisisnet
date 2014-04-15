var store = require("../cn-store-js")
  , _ = require("underscore")
  , clauses = require('./clauses');


/**
 * Query the datastore for an `Request` document. Allowed params are: createdAt, 
 * appID, userID. 
 */

var requestQueryBuilder = function(obj, cb) {
  var params = {};

  // before, after
  _.extend(params, clauses.addDateClause("createdAt", obj.before, obj.after));

  _.extend(params, clauses.addIsClause("userID", obj.userID));

  _.extend(params, clauses.addIsClause("appID", obj.appID));

  // orderBy
  var sort = { createdAt: -1 };

  // limit
  var limit = obj.limit || 25;
  
  // offset
  var offset = obj.offset || 0;
 
  find = store.Request.find(params)
    .limit(limit)
    .skip(offset)
    .sort(sort);

  find.exec(function(err, results) {
    store.Request.count(params, function(err, count) {
      cb(err, results, {total: count});
    });
  });
    
};

module.exports = requestQueryBuilder;