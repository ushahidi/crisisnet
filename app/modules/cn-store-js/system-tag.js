var mongoose = require('mongoose')
  , validator = require('mongoose-validator')
  , validate = validator.validate
  , _ = require('underscore')
  , schemaUtils = require("./utils");

// @TODO set autoIndex: false in production
// http://mongoosejs.com/docs/guide.html#indexes

var systemTagSchema = mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  name: String,
  categories: [String]
});

// Copying common methods, because inheriting from a base schema that inherited 
// from `mongoose.Schema` was annoying.
schemaUtils.setCommonFuncs("statics", systemTagSchema);
schemaUtils.setCommonFuncs("methods", systemTagSchema);

systemTagSchema.pre("save",function(next, done) {
    var self = this;

    // Note timestamp of update
    self.updatedAt = Date.now();

    next();
});

var SystemTag = mongoose.model('SystemTag', systemTagSchema);

module.exports = SystemTag;