var _ = require('underscore')
  , csv = require("fast-csv")
  , fs = require('fs')
  , item = require('../resources/item');

var run = function(searchDB) {
  var incidents = fs.createWriteStream(__dirname + "/../../static/snapshots/syria-incidents.csv");
  var cities = fs.createReadStream(__dirname + "/data/sy-cities.csv");
  var queryBuilder = item.queryBuilder(searchDB);

  incidents.write(["cityID", "cityName", "totalIncidents", "incidentDates"] + "\n");

  var csvStream = csv()
    .on("record", function(data){
      var name = data[1].replace(/\s/g,'').replace(/-/g,'');

      var searchTerms = {
        after: '2014-04-01',
        text: name,
        limit: 500
      };

      queryBuilder(searchTerms, function(err, searchData, metaData) {
        var dates = _(searchData).pluck('publishedAt').join('||');
        var row = [data[0], data[1], metaData.total, dates];
        incidents.write(row + "\n");
      });
    })
    .on("end", function(){
      console.log("done");
    });

  cities.pipe(csvStream);

  /*
  var cityJSON = require(__dirname + '/data/syria-cities.json');

  _(cityJSON.features).each(function(feature) {
    var toAdd = [feature.properties.PCODE, feature.properties.NAME_EN];
    cities.write(toAdd + "\n");
  });
  */
};

module.exports = run