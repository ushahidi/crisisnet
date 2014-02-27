var store = require("../cn-store-js");

var addClause = function(obj, key, str, f) { 
  if(str) obj[key] = f();
};

var addInClause = function(obj, key, str) {
  addClause(obj, key, str, function() { return { "$in": str.split(",") }});
};

// @TODO This is a placeholder and obviously not for production use.
var addSearchClause = function(obj, key, str) {
  addClause(obj, key, str, function() { return new RegExp(str, 'i'); });
};

var addDateClause = function(obj, key, str, dir) {
  addClause(obj, key, str, function() { 
    var paramKey = "$gt"
      , returnObj = {};

    if(dir === -1) paramKey = "$lt";
    returnObj[paramKey] = (new Date(str)).toISOString();
    
    return returnObj;
  });
};

var queryBuilder = function(obj, cb) {
  var params = {};

  addInClause(params, "tags", obj.tags);
  addInClause(params, "source", obj.sources);
  addSearchClause(params, "content", obj.text);
  addDateClause(params, "publishedAt", obj.before, -1);
  addDateClause(params, "publishedAt", obj.after);

  var offset = obj.offset || 0;
  var limit = obj.limit || 25;
  var sort = { publishedAt: -1 };

  var find;

  if(obj.location) {
    /*
    var distance = obj.distance || 10;
    var geoOptions = {
      near: obj.location.split(","),
      maxDistance: 10 / 6371,
      limit: limit
    }
    */
    var coords = obj.location.split(",").map(parseFloat);

    find = store.Item.geoNear(coords, { maxDistance : 20 / 6371, spherical : true }, cb);
  }

  else {
    find = store.Item.find(params)
      .limit(limit)
      .skip(offset)
      .sort(sort);

    find.exec(cb);
  }
    
};

var getSingle = function(req, res) {
  
};

var getAll = function(req, res) {
  var query = queryBuilder(req.query, function(err, results) {
    if(err) {
      console.log(err);
      return res.json(500, err);
    }
    res.json(200, results);
  });
};


var setupRoutes = function(app, path) {
  path = "/" + path;

  // Get all
  app.get(path, getAll);

  // Get one
  app.get(path+'/:id', getSingle);
};


module.exports = {
  setupRoutes: setupRoutes
}