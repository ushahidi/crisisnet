
var viewProfile = function(req, res) {
  res.render("profile", {user:req.user});
};

var setupRoutes = function(app, path) {
  path = "/" + path

  app.get(path, viewProfile);
};


module.exports = {
  setupRoutes: setupRoutes
}