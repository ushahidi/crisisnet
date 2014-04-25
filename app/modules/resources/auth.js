var _ = require("underscore");

var auth = {};

auth.limitRoleAccess = function() {
  var roles = Array.prototype.slice.call(arguments);
  return function(req, res, next) {
    if(_.intersection(roles, req.user.roles).length > 0) {
      next();
    }
    else {
      res.json(500, "Access denied");
    }
  };
};

module.exports = auth;