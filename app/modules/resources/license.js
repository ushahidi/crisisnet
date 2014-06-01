var auth = require("./auth")
  , _ = require("underscore")
  , clauses = require("./search-clauses")
  , store = require("../cn-store-js");

var queryBuilder = function(dbConn) {
  return function(obj, cb) {
    var params = {};

    _.extend(params, clauses.addIsClause("key", obj.key));
    _.extend(params, clauses.addIsClause("name", obj.name));

    // orderBy
    var sort = { createdAt: -1 };

    // limit
    var limit = obj.limit || 25;
    
    // offset
    var offset = obj.offset || 0;
   
    find = store.License.find(params)
      .limit(limit)
      .skip(offset)
      .sort(sort);

    find.exec(function(err, results) {
      store.License.count(params, function(err, count) {
        cb(err, results, {total: count});
      });
    });
      
  };
};

module.exports = {
  middlewares: [],
  queryBuilder: queryBuilder,
  options: {
    model: store.License
  }
}