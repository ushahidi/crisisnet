var mongoose = require('mongoose')
  , validator = require('mongoose-validator')
  , validate = validator.validate
  , Promise = require('promise')
  , _ = require('underscore')
  , _s = require('underscore.string')
  , schemaUtils = require("./utils");

// @TODO set autoIndex: false in production
// http://mongoosejs.com/docs/guide.html#indexes

var userSchema = mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  authProfiles: [{
    token: {
      type: String,
      index: true
    },
    secret: String,
    provider: {
      type: String,
      index: true
    },
    username: String,
    remoteID: String
  }],
  photos: [String],
  fullName: String,
  bio: String,
  locationName: String,
  apps: [
    {
      name: String,
      description: String,
      url: String,
      isActive: {
        type: String,
        default: true
      }
    }
  ]
});

// Copying common methods, because inheriting from a base schema that inherited 
// from `mongoose.Schema` was annoying.
schemaUtils.setCommonFuncs("statics", userSchema);
schemaUtils.setCommonFuncs("methods", userSchema);

userSchema.pre("save",function(next, done) {
    var self = this;

    // Note timestamp of update
    self.updatedAt = Date.now();

    next();
});

var User = mongoose.model('User', userSchema);

module.exports = User;