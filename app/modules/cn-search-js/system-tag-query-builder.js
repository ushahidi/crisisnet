var store = require("../cn-store-js")
  , _ = require("underscore")
  , clauses = require('./clauses');


var queryBuilder = function(obj, cb) {
  var params = {};

  _.extend(params, clauses.addInClause("categories", obj.categories));
  _.extend(params, clauses.addIsClause("name", obj.name));

  // orderBy
  var sort = { name: 1 };

  // limit
  var limit = obj.limit || 50;
  
  // offset
  var offset = obj.offset || 0;
 
  find = store.SystemTag.find(params)
    .limit(limit)
    .skip(offset)
    .sort(sort);

  find.exec(function(err, results) {
    store.SystemTag.count(params, function(err, count) {
      cb(err, results, {total: count});
    });
  });
    
};

module.exports = queryBuilder;