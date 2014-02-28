var authRequired = function(req, res, next) {
  var redirectTo = "/auth/signup";
  if(!req.user) return res.redirect(redirectTo);
  next();
};

module.exports = {
  authRequired: authRequired
}