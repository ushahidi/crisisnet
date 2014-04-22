var queryBuilder = require("../cn-search-js").userQueryBuilder
  , utils = require('./utils');

var setupRoutes = utils.setupRoutes([queryBuilder, 
  utils.limitRoleAccess(['admin'])]);

module.exports = {
  setupRoutes: setupRoutes
}