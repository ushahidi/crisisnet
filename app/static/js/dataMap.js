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
    isDynamic: true,
    mapping: {},
    statics: {}
  };

  var sourceState = {
    lastChanged: []
  };

  var updateSource = function(msg, data) {
    if(data.changeType === 'mapping') {
      e.source.mapping[data.to.path] = data.from.path;
    }
    else {
      e.source.statics[data.to.path] = data.to.text;
    }
    
    sourceState.lastChanged.unshift({changeType: data.changeType, path: data.to.path});
  };

  var validateSource = function(msg, data) {
    var invalidProps = [],
        requiredItemProperties = ['remoteID', 'content'],
        requiredProperties = [
          'sourceType', 
          'sourceURL', 
          'description', 
          'listProperty'
        ];

    _(requiredProperties).each(function(prop) {
      if(_(e.source[prop]).isEmpty()) {
        invalidProps.push(prop);
      }
    });

    _(requiredItemProperties).each(function(prop) {
      if(_(e.source.mapping[prop]).isEmpty() && _(e.source.statics[prop]).isEmpty()) {
        dataMap.bus.publish('item.invalid', { 
          to: { path: prop } 
        });

        return false;
      }
    });

    if(invalidProps.length > 0) {
      dataMap.bus.publish('source.invalid', { props: props });
      return false;
    }
    else {
      dataMap.bus.publish('source.valid');
      return true;
    }

  };

  var validateItem = function(msg, data) {
    var required = function(val) {
      return !_(val).isEmpty();
    };

    var isDate = function(val) {
      try {
        return (new Date(val)).toString() !== "Invalid Date";
      }
      catch(err) {
        return false;
      }
    };

    var isIn = function(arr) {
      return function(val) {
        return _(arr).contains(val);
      };
    };

    var rules = {
      'remoteID': [required],
      'content': [required],
      'publishedAt': [isDate],
      'activeUntil': [isDate],
      'lifespan': [isIn(['temporary', 'semi-permanent', 'permanent'])],
      'summary': [_.isString], 
      'image': [validator.isURL],
      'coords.latitude': [validator.isFloat],
      'coords.longitude': [validator.isFloat],
      'tags.name': [_.isString],
      'fromURL': [validator.isURL]
    };

    if(!_(rules[data.to.path]).isUndefined() && 
        !_.every(_.map(rules[data.to.path], 
          function(rule) { 
            return rule(data.to.text) } ))) 
    {
      // get rid of the 'mapping' or 'static' specific to e.source structure
      dataMap.bus.publish('item.invalid', data);
    }
    else {
      dataMap.bus.publish('item.valid', data);
    }
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

  dataMap.bus.subscribe('item.changed', updateSource);
  dataMap.bus.subscribe('item.changed', validateItem);
  dataMap.bus.subscribe('undo', undo);

  var findLists = function(obj, lists, curPath) {
    if(_(obj).isArray()) {
      return [{value:obj, path: '.'}];
    }

    _(obj).each(function(value, key) {
      var path = (function() {
        if(curPath) {
          return curPath + "." + key;
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
  e.state = { lastChanged: [], isValid: false };
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

  e.showError = function(msg) {
    $('#errors').text(msg);
  };

  e.hideError = function() {
    $('#errors').empty();
  };
  
  // Event bindings
  $('#undo').on('click', function() { dataMap.bus.publish('undo') });

  dataMap.bus.subscribe('item.changed', function(msg, data) {
    e.state.lastChanged.unshift(data);
  });

  dataMap.bus.subscribe('undo', undo);
  dataMap.bus.subscribe('item.invalid', function(msg, data) {
    e.state.isValid = false;

    if(!data.to.$el) {
      data.to.$el = $('[data-path='+data.to.path+']').find('.property-value');
    }

    data.to.$el.parent('.property-container').addClass('has-error');
    e.showError(data.to.path + " is not correct. Please check that value and try again.");
  });

  dataMap.bus.subscribe('item.valid', function(msg, data) {
    e.state.isValid = true;
    e.hideError();
    $('.has-error').removeClass('has-error');
  });

  dataMap.bus.subscribe('source.invalid', function(msg, data) {
    e.state.isValid = false;
    console.log("wrong!");
  });

  dataMap.bus.subscribe('source.valid', function(msg, data) {
    e.state.isValid = true;
  });

  e.setupItem = setupItem;
  e.setupSource = setupSource;
  e.initUI = initInteractions;
  return e;
})(dataMap);
