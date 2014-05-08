var dataMap = {
  bus: PubSub
};

dataMap.data = (function(dataMap) {
  var e = {};

  e.source = {
    sourceType: null,
    sourceURL: null,
    sourceDataType: 'json',
    description: null,
    listProperty: null,
    startDate: null,
    endDate: null,
    frequency: 'once',
    isDynamic: true,
    mapping: {},
    statics: {}
  };

  var sourceState = {
    lastChanged: []
  };

  var updateSourceMapping = function(msg, data) {
    if(data.changeType === 'mapping') {
      e.source.mapping[data.to.path] = data.from.path;
    }
    else {
      e.source.statics[data.to.path] = data.to.text;
    }
    
    sourceState.lastChanged.unshift({changeType: data.changeType, path: data.to.path});
  };

  var updateSource = function(msg, data) {
    e.source[data.to.path] = data.to.text;
  };

  e.validate = function() {
    if(!validateSource() || !validateItem()) {
      return false;
    };

    dataMap.bus.publish("validated");
    return true;
  };

  var customValidators = {
    required: function(val) {
      return !_(val).isEmpty();
    },
    isDate: function(val) {
      try {
        try {
          var maybeEpoch = parseInt(val)
          if(!_(maybeEpoch).isNaN() && maybeEpoch > 3000) {
            val = maybeEpoch;
          }
        }
        catch(err) {}
        return (new Date(val)).toString() !== "Invalid Date";
      }
      catch(err) {
        return false;
      }
    },
    isIn: function(arr) {
      return function(val) {
        return _(arr).contains(val);
      };
    }
  };

  var validateChange = function(rules, data, key) {
    if(!_(rules[data.to.path]).isUndefined() && 
        !_.every(_.map(rules[data.to.path].checks, 
          function(rule) { 
            return rule(data.to.text) } ))) 
    {
      // get rid of the 'mapping' or 'static' specific to e.source structure
      data.to.errorMessage = rules[data.to.path].message;
      dataMap.bus.publish(key+'.invalid', data);
    }
    else {
      dataMap.bus.publish(key+'.validProp', data);
    }
  };

  var validateSource = function() {
    var isValid = true,
        requiredProperties = [
          'sourceType', 
          'sourceURL', 
          'description', 
          'listProperty',
          'startDate',
          'endDate'
        ];

    _(requiredProperties).each(function(prop) {
      if(_(e.source[prop]).isEmpty()) {
        isValid = false;
        dataMap.bus.publish('source.invalid', { to: { path: prop } });
      }
      else {
        dataMap.bus.publish('source.validProp', { to: { path: prop } });
      }
    });

    return isValid;
  };

  var validateSourceChange = function(msg, data) {
    var cv = customValidators;
    var rules = {
      'sourceType': {
        checks: [cv.required],
        message: 'Please give your data source a name'
      },
      'description': {
        checks: [cv.required],
        message: 'Please give your data source a description'
      },
      'sourceURL': {
        checks: [cv.required, validator.isURL],
        message: 'Please enter a valid URL'
      }
    };

    validateChange(rules, data, 'source');

    if(data.to.path === "sourceType") {
      $.ajax({
        url: 'http://localhost:8083/source?sourceType='+data.to.text,
        type: "get",
        beforeSend: function(xhr) {
          xhr.setRequestHeader('Authorization', 'Bearer 532d1bb6bbcdd1862d6e15b4');
        },
        success: function (returnData) {
          if(returnData.total > 0) {
            data.to.errorMessage = "A source with the name '"+data.to.text+"' already exists."
            dataMap.bus.publish('source.invalid', data);
          }
        }
      });
    }

  };

  var validateItem = function() {
    var requiredItemProperties = ['remoteID', 'content'],
        isValid = true;

    _(requiredItemProperties).each(function(prop) {
      if(_(e.source.mapping[prop]).isEmpty() && _(e.source.statics[prop]).isEmpty()) {
        dataMap.bus.publish('item.invalid', { 
          to: { path: prop } 
        });

        isValid = false;
      }
    });

    return isValid;
  };

  var validateItemChange = function(msg, data) {
    var cv = customValidators;
    var rules = {
      'remoteID': {
        checks: [cv.required],
        message: 'A remoteID is required'
      },
      'content': {
        checks: [cv.required]
      },
      'publishedAt': {
        checks: [cv.isDate]
      },
      'activeUntil': {
        checks: [cv.isDate]
      },
      'lifespan': {
        checks: [cv.isIn(['temporary', 'semi-permanent', 'permanent'])]
      },
      'summary': {
        checks: [_.isString]
      }, 
      'image': {
        checks: [validator.isURL]
      },
      'coords.latitude': {
        checks: [validator.isFloat]
      },
      'coords.longitude': {
        checks: [validator.isFloat]
      },
      'tags.name': {
        checks: [_.isString]
      },
      'fromURL': {
        checks: [validator.isURL]
      }
    };

    validateChange(rules, data, 'item');
  };

  var undo = function() {
    if(sourceState.lastChanged.length > 0) {
      var lastChanged = sourceState.lastChanged.shift();
      if(lastChanged.changeType === 'mapping') {
        delete e.source.mapping[lastChanged.path];
      }
      else {
        delete e.source.statics[lastChanged.path];
      }
    }
  };

  dataMap.bus.subscribe('item.changed', updateSourceMapping);
  dataMap.bus.subscribe('item.changed', validateItemChange);
  dataMap.bus.subscribe('source.changed', updateSource);
  dataMap.bus.subscribe('source.changed', validateSourceChange);
  dataMap.bus.subscribe('undo', undo);

  var findLists = function(obj, lists, curPath) {
    if(_(obj).isArray()) {
      return [{value:obj, path: '.'}];
    }

    _(obj).each(function(value, key) {
      var path = (function() {
        if(curPath) {
          return curPath + "|" + key;
        }
        else {
          return key;
        }
      })();

      if(_(value).isArray()) { 
        lists.push({
          path: path,
          value: value
        }) 
      }
      
      else if(_(value).isObject()) { 
        findLists(value, lists, path);
      }
    });

    return lists;
  };

  var getSampleSourceDoc = function(jsonData) {
    var lists = findLists(jsonData, []);
    var exampleObject = _.max(lists, function(list){ return list.value.length; });

    e.source.listProperty = exampleObject.path;
    return exampleObject.value[0];
  };

  e.getSampleSourceDoc = getSampleSourceDoc;
  return e;
})(dataMap);


dataMap.UI = (function(dataMap) {
  var exports = e = {};
  e.state = { 
    lastChanged: [], 
    invalidItems: [],
    invalidSources: [],
    isValid: false
  };

  e.setErrorState = function(type, validity, path) {
    var props = {
      item: e.state.invalidItems,
      source: e.state.invalidSources
    };

    var arr = props[type];

    if(validity === 'valid') {
      props[type] = _(arr).without(path); 
    }
    else if(!_(arr).contains(path)) {
      props[type].push(path);
    }

    if(e.state.invalidItems.length === 0 && e.state.invalidSources.length) {
      e.state.isValid = true;
    }

    else {
      e.state.isValid = false;
    }
  };
  
  var required = [
    'remoteID',
    'content'
  ];

  var undo = function() {
    if(e.state.lastChanged.length === 0) { return false; }

    var lastChanged = e.state.lastChanged.shift();

    lastChanged.to.$el
        .text(lastChanged.to.$el.attr('data-content'))
        .removeAttr('data-edited');

    if(lastChanged.changeType === "mapping") {
      lastChanged.from.$el.removeAttr('style');
      lastChanged.to.$el.attr('contenteditable', true);
    }

  };

  var setRequired = function() {
    _(required).each(function(path) {
      var $obj = $("[data-path='"+path+"']");
      $obj.attr('data-required', true);
    });
  };

  var initInteractions = function(sourceElement, itemElement) {
    var droppables = interact(itemElement + ' span.property-value')
        // enable draggables to be dropped into this
        .dropzone(true)
        // only accept elements matching this CSS selector
        .accept(sourceElement + ' .property-container')
        // listen for drop related events
        .on('dragenter', function (event) {
            var draggableElement = event.relatedTarget,
                dropzoneElement = event.target;

            // feedback the possibility of a drop
            dropzoneElement.classList.add('drop-target');
            draggableElement.classList.add('can-drop');
        })
        .on('dragleave', function (event) {
            // remove the drop feedback style
            event.target.classList.remove('drop-target');
            event.relatedTarget.classList.remove('can-drop');
        })
        .on('drop', onDrop);

    var draggables = interact(sourceElement + ' .property-container')
        .draggable({
            onmove: function (event) {
                var target = event.target;

                target.x = (target.x|0) + event.dx;
                target.y = (target.y|0) + event.dy;

                target.style.webkitTransform = target.style.transform =
                    'translate(' + target.x + 'px, ' + target.y + 'px)';
            },
            onend: function(event) {
                var $target = $(event.target);
                if(!$(event.target).hasClass('can-drop')) {
                  $target.removeAttr('style');
                  event.target.x = 0;
                  event.target.y = 0;
                }
            }
        })
        .inertia(false)
        .autoScroll(true)
        //.restrict({ drag: 'parent' });
  };

  var setStaticText = function(evt) {
    var $target = $(evt.target);
    $target.attr('data-edited', true);
    dataMap.bus.publish('item.changed', {
      changeType: 'static',
      to: {
        text: $target.text(),
        path: $target.parent('.property-container').attr('data-path'),
        $el: $target
      }
    });
  };

  var setupItem = function(itemElement, itemDoc) {
    var $itemElement = $(itemElement);
    e.state.$itemElement = $itemElement;
    $itemElement.jsonMarkup(itemDoc);
    setRequired();

    $itemElement.find('span.property-value')
      .attr('contenteditable', true)
      .on('blur', setStaticText);

    return $itemElement;
  };

  var setupSource = function(sourceElement, sourceDoc) {
    var $sourceElement = $(sourceElement);
    e.state.$sourceElement = $sourceElement;
    $sourceElement.jsonMarkup(sourceDoc);

    return $sourceElement;
  };

  var onDrop = function (event) {
      event.stopPropagation();

      event.relatedTarget.x = 0;
      event.relatedTarget.y = 0;

      var $target = $(event.target);
      var $dropped = $(event.relatedTarget);

      var fromPath = $dropped.attr('data-path');
      var toPath = $target.parent('.property-container').attr('data-path');

      dataMap.bus.publish('item.changed', {
        changeType: 'mapping',
        to: {
          path: toPath,
          text: $dropped.find('span.property-value').eq(0).text(),
          $el: $target
        },
        from: {
          path: fromPath,
          $el: $dropped
        }
      });

      $target
        .text(fromPath)
        .removeClass('drop-target')
        .attr('data-example-value', $dropped.find('.property-value').eq(0).attr('data-content'))
        .attr('data-edited', true)
        .removeAttr('contenteditable');
      $dropped
        .css({"visibility":"hidden"})
        .removeClass('can-drop');
  };

  e.addError = function(msg, path) {
    if($('[data-error-path="'+path+'"]').length > 0) {
      return;
    }

    var $el = $('<span>', { 'data-error-path': path, text: msg + " " });
    $('#errors').append($el);
  };

  e.removeError = function(errorPath) {
    $('#errors').find('[data-error-path="'+errorPath+'"]').remove();
  };
  
  // Event bindings
  $('#undo').on('click', function() { dataMap.bus.publish('undo') });
  $('#sourceType, #description, #sourceURL, #startDate, #endDate').on('blur', function(e) { 
    var $this = $(this);
    
    dataMap.bus.publish('source.changed', {
      to: {
        $el: $this,
        path: $this.attr('id'),
        text: $this.val()
      }
    });
  });

  dataMap.bus.subscribe('item.changed', function(msg, data) {
    e.state.lastChanged.unshift(data);
  });

  dataMap.bus.subscribe('undo', undo);
  
  dataMap.bus.subscribe('item.invalid', function(msg, data) {
    e.setErrorState('item', 'invalid', data.to.path);

    if(!data.to.$el) {
      data.to.$el = $('[data-path="'+data.to.path+'"]').find('.property-value');
    }

    data.to.$el.parent('.property-container').addClass('has-error');
    var errorMessage = data.to.errorMessage || data.to.path + " is not correct. Please check that value and try again.";
    e.addError(errorMessage, data.to.path);
  });

  dataMap.bus.subscribe('item.validProp', function(msg, data) {
    e.setErrorState('item', 'valid', data.to.path);
    e.removeError(data.to.path);

    if(!data.to.$el) {
      data.to.$el = $('[data-path="'+data.to.path+'"]').find('.property-value');
    }

    data.to.$el.closest('.property-container').removeClass('has-error');
  });

  dataMap.bus.subscribe('source.invalid', function(msg, data) {
    e.setErrorState('source', 'invalid', data.to.path);
    if(!data.to.$el) {
      data.to.$el = $('#'+data.to.path);
    }
    var $parent = data.to.$el.closest('.form-group');
    $parent.addClass('has-error');

    var errorMessage = data.to.errorMessage || data.to.$el.attr('data-display-name') + " needs a second look.";
    e.addError(errorMessage, data.to.path);
  });

  dataMap.bus.subscribe('source.validProp', function(msg, data) {
    e.setErrorState('source', 'valid', data.to.path);
    if(!data.to.$el) {
      data.to.$el = $('#'+data.to.path);
    }
    var $parent = data.to.$el.closest('.form-group');
    $parent.removeClass('has-error');
    e.removeError(data.to.path);
  });

  dataMap.bus.subscribe('validated', function(msg, data) {
    e.state.isValid = true;
  });

  e.setupItem = setupItem;
  e.setupSource = setupSource;
  e.initUI = initInteractions;
  return e;
})(dataMap);
