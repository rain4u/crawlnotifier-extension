function buildURL(window) {
  return window.location.protocol + "//" + window.location.host + window.location.pathname;
}

function encodeDOM(elem, document) {
  var breadcrumbs = [];

  while (elem != document) {
    if (elem.id) {
      breadcrumbs.unshift('#' + elem.id);
      break;
    }

    var idx = Array.prototype.indexOf.call(elem.parentNode.childNodes, elem);
    breadcrumbs.unshift(idx);


    elem = elem.parentNode;
  }

  return breadcrumbs.join(' ');
}

function decodeDOM(breadcrumb_str, document) {
  var elem = document;
  var breadcrumbs = breadcrumb_str.split(' ');

  for (var i in breadcrumbs) {
    if (breadcrumbs[i].startsWith('#')) {
      elem = elem.getElementById(breadcrumbs[i].substr(1));
    } else {
      elem = elem.childNodes[breadcrumbs[i]];
    }
  }

  return elem;
}

// Source: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function hashCode(text) {
  var hash = 0;

  if (text.length === 0) {
    return hash;
  }

  for (i = 0; i < text.length; i++) {
    c = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash = hash & hash;
  }

  return hash;
}