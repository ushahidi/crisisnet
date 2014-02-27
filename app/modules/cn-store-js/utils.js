var Promise = require('promise')
  , _ = require('underscore')
  , _s = require('underscore.string');


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


statics.upsert = function(data, conditions) {
  var that = this;
  return new Promise(function(resolve, reject) {
    /** 
     * Iterate over each passed property. Because these can be dot-delimited 
     * paths (like for the param `{"my.nested.property": obj.my.nested.property }`), 
     * we may need to drill down to the correct level of the passed object, hence 
     * the `reduce` step.
     */
    var upsertConditions = {};
    _.each(conditions, function(prop) {
      var objProp = _.reduce(prop.split("."), function(memo, prop) { return memo[prop] }, data);
      upsertConditions[prop] = objProp;
    }); 
    that.findOne(upsertConditions,
      // callback
      function(err, obj) {
        if(err) return reject(err);
        
        // we did not find an item matching the query conditions, so make one
        if(!obj) {
          obj = new that(data);
        }
        // extend the item we found with new data
        else {
          _(obj).extend(data);
        }

        // return a promise
        resolve(obj.saveP());
      }
    );
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
    return that.upsert(obj, upsertProperties);
  });

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
