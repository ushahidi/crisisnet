(function($) {
  var buildContainerNode = function(keyName, $parent) {
    var $node = $('<div>', {class: 'property-container'});
    var $name = $('<span>', {class: 'property-name', text: keyName});

    $node.append($name);

    var path = $parent.closest('.property-container').attr('data-path');
    if(path) {
      path = path + "|" + keyName;
    }
    else {
      path = keyName;
    }
    $node.attr('data-path', path);

    return $node;
  };

  var buildChildNodes = function(value, $target) {
    var $node;
    
    if($.isArray(value)) {
      $node = $('<div>', {class: 'property-value array-container'});
      $target.append($node);

      $.each(value, function(i, v) {
        buildChildNodes(v, $node);
      });
    }

    else if($.isPlainObject(value)) {
      $node = $('<div>', {class: 'property-value object-container'});
      $target.append($node);
      buildObjectNode(value, $node); 
    }
    
    else {
      $node = $('<span>', {
        class: 'property-value', 
        text: value,
        'data-content': value
      });
      $target.append($node);
    }
  };

  var buildObjectNode = function(obj, $target) {
    $.each(obj, function(key, value) {
      var $containerNode = buildContainerNode(key, $target);
      $target.append($containerNode);

      buildChildNodes(value, $containerNode);
    });
  };

  $.fn.jsonMarkup = function(jsonData) {
      buildObjectNode(jsonData, this);
  };
})(jQuery);