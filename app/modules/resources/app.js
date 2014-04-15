var queryBuilder = require("../cn-search-js").appQueryBuilder
  , utils = require('./utils');

var setupRoutes = utils.setupRoutes(queryBuilder);

module.exports = {
  setupRoutes: setupRoutes
}