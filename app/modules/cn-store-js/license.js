var mongoose = require('mongoose')
  , validate = require('mongoose-validator').validate
  , schemaUtils = require("./utils");

/**
 * A License document outlines the usage rules associated with that license.
 */

var licenseSchema = mongoose.Schema({
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date,
    key: {
      type: String,
      required: true,
      index: true
    },
    name: String,
    description: String,
    url: {
      type: String,
      validate: validate('isUrl')
    }
});

// Copying common methods, because inheriting from a base schema that inherited 
// from `mongoose.Schema` was annoying.
schemaUtils.setCommonFuncs("statics", licenseSchema);
schemaUtils.setCommonFuncs("methods", licenseSchema);

licenseSchema.pre("save",function(next, done) {
    var self = this;
    self.updatedAt = Date.now();
    next();
});

var License = mongoose.model('License', licenseSchema);

module.exports = License;