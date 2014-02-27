var mongoose = require('mongoose')
  , validator = require('mongoose-validator')
  , validate = validator.validate
  , Promise = require('promise')
  , _ = require('underscore')
  , _s = require('underscore.string');

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
  locationName: String

});

userSchema.pre("save",function(next, done) {
    var self = this;

    // Note timestamp of update
    self.updatedAt = Date.now();

    next();
});