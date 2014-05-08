var mongoose = require('mongoose')
  , validate = require('mongoose-validator').validate
  , schemaUtils = require("./utils");

/**
 * A Source document represents a source of data.
 */

var sourceSchema = mongoose.Schema({
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date,
    internalID: {
      type: String,
      index: true
    },
    /**
     * `sourceType` lets the application know how the incoming data will be 
     * retrieved and structured. Often times there will only be one source 
     * for a given source type - for example a one-off dataset kept in a 
     * spreadsheet. However with services like Twitter, that provide data 
     * on an ongoing basis, there may be many sources, each retrieving data 
     * in a specific way - for example tweets with a particular hashtag, or 
     * within a given geospatial boundry.
     */
    sourceType: {
      type: String,
      required: true,
      index: true
    },
    sourceURL: {
      type: String,
      validate: validate('isUrl')
    },
    sourceDataType: {
      type: String,
      default: 'json'
    },
    listProperty: String,
    isDynamic: {
      type: Boolean,
      default: false
    },
    mapping: mongoose.Schema.Types.Mixed,
    statics: mongoose.Schema.Types.Mixed,
    /**
     * Most sources will repeat, because they poll an endpoint periodically for 
     * new or updated data. However it is also possible to have sources that 
     * are "always" retrieved (streaming services like Twitter and Facebook), 
     * and sources that need to be retrieved only once.
     */
    frequency: {
      type: String,
      required: true,
      validate: validate('isIn', ['once', 'always', 'repeats'])
    },
    repeatsEvery: {
      type: String,
      validate: validate('isIn', ['minute', 'hour', 'day', 'week'])
    },
    hasRun: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    description: String,
    status: {
      type: String,
      required: true,
      default: 'active',
      index: true,
      validate: validate('isIn', ['active', 'failing', 'inactive'])
    },
    lastRun: Date,
    /**
     * Some services allow us to search "since" an id, or since a particular 
     * date, etc etc so it's useful to know what we sucked last.
     */
    lastRetrieved: mongoose.Schema.Types.Mixed,
    filters: mongoose.Schema.Types.Mixed,
    /**
     * External data is a gnarly, dangerous beast. It will inevitably break
     * our application from time to time. When it does, we capture it here, 
     * so developers can test failing sources.
     */
    failData: mongoose.Schema.Types.Mixed
    //createdBy: User
});

// Copying common methods, because inheriting from a base schema that inherited 
// from `mongoose.Schema` was annoying.
schemaUtils.setCommonFuncs("statics", sourceSchema);
schemaUtils.setCommonFuncs("methods", sourceSchema);

sourceSchema.methods.repeatMilliseconds = function() {
  var msDict = {
    minute: 60000,
    hour: 3600000,
    day: 86400000,
    week: 604800000
  };

  if (this.repeatsEvery && msDict[this.repeatsEvery]) {
    return msDict[this.repeatsEvery];
  }
  else {
    throw "Can't call repeatMilliseconds if repeatsEvery property is not set"
  }
};

sourceSchema.statics.findActive = function(callback) {
  var now = Date.now();
  this.find({
    status: 'active', 
    startDate: {'$lte': now}, 
    endDate: {'$gte': now}
  }, callback);
};

// specify the transform schema option
if (!sourceSchema.options.toObject) sourceSchema.options.toObject = {};
sourceSchema.options.toObject.transform = function (doc, ret, options) {
  ret.id = doc.id;
}

// specify the transform schema option
if (!sourceSchema.options.toJSON) sourceSchema.options.toJSON = {};
sourceSchema.options.toJSON.transform = function (doc, ret, options) {
  ret.id = doc.id;
}

sourceSchema.pre("save",function(next, done) {
    var self = this;
    self.updatedAt = Date.now();
    next();
});

var Source = mongoose.model('Source', sourceSchema);

module.exports = Source;