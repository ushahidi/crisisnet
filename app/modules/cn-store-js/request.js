var mongoose = require('mongoose')
  , validator = require('mongoose-validator')
  , validate = validator.validate
  , _ = require('underscore')
  , schemaUtils = require("./utils");

// @TODO set autoIndex: false in production
// http://mongoosejs.com/docs/guide.html#indexes

var requestSchema = mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  userID: {
    type: mongoose.Schema.ObjectId,
    index: true,
    required: true
  },
  appID: {
    type: mongoose.Schema.ObjectId,
    index: true,
    required: true
  }
});

// Copying common methods, because inheriting from a base schema that inherited 
// from `mongoose.Schema` was annoying.
schemaUtils.setCommonFuncs("statics", requestSchema);
schemaUtils.setCommonFuncs("methods", requestSchema);

requestSchema.pre("save",function(next, done) {
    var self = this;

    // Note timestamp of update
    self.updatedAt = Date.now();

    next();
});

var Request = mongoose.model('Request', requestSchema);

module.exports = Request;