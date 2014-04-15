var Promise = require('promise')
  , _ = require('underscore')
  , _s = require('underscore.string')
  , logger = require('winston');


/**
 * The `methods` and `statics` function can be appended to their equivalent property 
 * on a `mongoose.Schema` object. The `this` keyword in the function body refers
 * to the `mongoose.Schema` instance. This behaves just as if you had manually 
 * assigned the functions to the instance. 
 *
 * `yourSchema.statics = function() { return "whatever"; };`
 */

var statics = {}
  , methods = {};

methods.saveP = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    that.save(function(err, obj) {
      if(err) return reject(err);

      resolve(obj);
    })
  });
};

statics.getOrCreate = function(upsertConditions, data, callback) {
  var that = this;
  this.findOne(upsertConditions,
    // callback
    function(err, obj) {
      if(err) {
        logger.error("utils.upsert findOne failed " + err);
        callback(err);
      }
      
      // we did not find an item matching the query conditions, so make one
      if(!obj) {
        //logger.info("utils.upsert creating new record");
        obj = new that(data);
      }
      // extend the item we found with new data
      else {
        obj = _(obj).extend(data);
      }

      data = null;

      obj.save(function(err, item) {
        if(callback && typeof callback === "function") {
          callback(err, item);
        }
        item = null;
      });
    }
  );
};


statics.upsert = function(data, conditions, callback) {
  var upsertConditions = {};
    
  _.each(conditions, function(prop) {
    upsertConditions[prop] = data[prop];
  });

  this.getOrCreate(upsertConditions, data, callback);
};

statics.upsertP = function(data, conditions) {
  var that = this;
  return new Promise(function(resolve, reject) {
    that.upsert(data, conditions, function(err, obj) {
      if(err) { 
        reject(err);
      }
      else {
        resolve(obj);
      }
    });
  });
};


/**
 * Take an array of objects that conform to Item schema. Generate a list of 
 * promises, and return the promise object that results from calling `Promise.all` 
 * on the list. This allows the caller to assign a single function to be executed 
 * when all models or saved or an error occurs. 
 *
 * If the save is successful the caller will receive a list of saved model
 * instances.
 *
 * @param {Array} data - List of objects that conform to Item schema
 */
statics.saveList = function(data, upsertProperties) {
  var that = this;
  // Create a list of promises. 
  var funcs = _(data).map(function(obj) {
    return that.upsertP(obj, upsertProperties);
  });

  //logger.info("saveList have funcs");
  return Promise.all(funcs);
};


var setCommonFuncs = function(funcType, schema, methodNames) {
  var lists = {
    statics: statics,
    methods: methods
  };

  _.each(_.keys(lists[funcType]), function(key) {
    if(!methodNames || _(methodNames).contains(key)) {
      schema[funcType][key] = lists[funcType][key];
    }
  });
};

module.exports = {
  setCommonFuncs: setCommonFuncs
};
