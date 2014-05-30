var passport = require("passport")
  , _ = require('underscore')
  , json2csv = require('json2csv');

var setup = {};

setup.getAll = function(queryBuilder) { 
  return function(req, res) {
    var query = queryBuilder(req.query, function(err, results, meta) {
      if(err) {
        return res.json(500, err);
      }

      var format = req.query.format;
      var isAJAX = req.xhr;

      if(format && !isAJAX && format === 'csv') {
        var commonFields = [
            'id',
            'content',
            'source',
            'image',
            'video',
            'publishedAt',
            'createdAt',
            'updatedAt',
            'license',
            'fromURL',
            'summary',
            'lifespan'
          ];

          var adminAreas = [
            'adminArea1',
            'adminArea2',
            'adminArea3',
            'adminArea4',
            'adminArea5'
          ];

        var csvOutput = results.map(function(item) {
          var tags = item.tags || [];

          var toReturn = {};

          _(commonFields).each(function(field) {
            toReturn[field] = item[field];
          });

          
          if(item.tags) {
            toReturn.tags = _(item.tags).pluck('name').join('|');
          }

          if(item.geo) {
            if(item.geo.addressComponents) {
              _(adminAreas).each(function(admin) {
                toReturn[admin] = item.geo.addressComponents[admin];
              });
            }

            if(item.geo.coords) {
              toReturn.longitude = item.geo.coords[0];
              toReturn.latitude = item.geo.coords[1];
            }

            return toReturn;
          }; //csv map
        });

        json2csv({
          data: csvOutput, 
          fields: commonFields.concat(adminAreas).concat(['tags','longitude','latitude'])
        }, function(err, csv) {
          if (err) { res.json(500, err); } 
          
          res.send(new Buffer(csv));
        });
      }
      else {
        var responseObj = {
          total: meta.total,
          data: results
        };
        res.json(200, responseObj);
      }
    });
  };
};

setup.getSingle = function() {};

setup.create = function(model) {
  return function(req, res) {
    var obj = new model(req.body);

    obj.save(function(err, doc) {
      if(err) {
        console.log(err);
        res.json(500, err.message);
      }
      else {
        res.json(201, doc);
      }
    });
  }
};

setup.setupRoutes = function(endpoint, app, middlewares, queryBuilder, options) {
    path = "/" + endpoint;

    var args = [passport.authenticate(['bearer','localapikey'], { session: false })];
    args = args.concat(middlewares);
    
    // Get all
    args.unshift(path);
    args.push(setup.getAll(queryBuilder));
    app.get.apply(app, args);

    // Get one
    args[0] = path+'/:id';
    args.pop(); // get rid of getAll
    args.push(setup.getSingle);
    app.get.apply(app, args);

    // Post
    if(options && options.create) {
      args[0] = path;
      args.pop();
      args.push(setup.create(options.model));
      app.post.apply(app, args);
    }
};

module.exports = setup;