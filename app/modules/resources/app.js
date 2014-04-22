var queryBuilder = require("../cn-search-js").appQueryBuilder
  , utils = require('./utils');

var setupRoutes = utils.setupRoutes([queryBuilder, 
  utils.limitRoleAccess(['admin'])]);

module.exports = {
  setupRoutes: setupRoutes
}