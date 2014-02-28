var authRequired = function(f, redirectTo) {
  return function(req, res) {
    redirectTo = redirectTo || "/auth/signup";
    if(!req.user) return res.redirect(redirectTo);
    f(req,res);
  }
};

module.exports = {
  authRequired: authRequired
}