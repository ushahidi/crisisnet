var syriaTracker = require('./syria-tracker');


var run = function(db, searchDB) {
  syriaTracker(searchDB);
};

module.exports = run;