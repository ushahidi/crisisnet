var auth = require("./auth")
  , _ = require("underscore")
  , clauses = require("./search-clauses")
  , store = require("../cn-store-js");

var queryBuilder = function(dbConn) {
  return function(obj, cb) {
    var params = {};

    // before, after
    _.extend(params, clauses.addDateClause("createdAt", obj.before, obj.after));

    _.extend(params, clauses.addIsClause("_id", obj.userID));

    // orderBy
    var sort = { createdAt: -1 };

    // limit
    var limit = obj.limit || 25;
    
    // offset
    var offset = obj.offset || 0;
   
    find = store.User.find(params, 'apps')
      .limit(limit)
      .skip(offset)
      .sort(sort);

    find.exec(function(err, results) {
      var o = {};
      o.map = function () { emit(1, this.apps.length) };
      o.reduce = function (key, appsLength) { 
        return Array.sum(appsLength);
      };
      
      store.User.mapReduce(o, function (err, appCount) {
        var apps = _(results).pluck('apps').reduce(
          function(prev, cur) { return prev.concat(cur)});  
        
        cb(err, apps, {total: appCount[0].value});
      });
    
    });
  };
};

module.exports = {
  middlewares: [auth.limitRoleAccess('admin')],
  queryBuilder: queryBuilder
}