_ = require("underscore");

var clauses = {};

var addClause = function(key, str, f) { 
  var obj = {};
  if(!_(str).isUndefined()) obj[key] = f();
  return obj;
};

clauses.addInClause = function(key, str) {
  return addClause(key, str, function() { return { "$in": str.split(",") }});
};

clauses.addIsClause = function(key, str) {
  return addClause(key, str, function() { return str; });
};

// @TODO This is a placeholder and obviously not for production use.
clauses.addSearchClause = function(key, str) {
  return addClause(key, str, function() { return new RegExp(str, 'i'); });
};

clauses.addDateClause = function(key, before, after) {
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

module.exports = clauses;