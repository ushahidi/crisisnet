var queryBuilder = require("../cn-search-js").sourceQueryBuilder
  , utils = require('./utils');

var setupRoutes = utils.setupRoutes(queryBuilder);

module.exports = {
  setupRoutes: setupRoutes
}