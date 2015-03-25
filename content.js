function encodeDOM(elem) {
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

function decodeDOM(index_str) {
  var elem = document;
  var indexes = index_str.split(' ');

  for (var i in indexes) {
    if (indexes[i].startsWith('#')) {
      elem = elem.getElementById(indexes[i].substr(1));
    } else {
      elem = elem.childNodes[indexes[i]];
    }
  }

  return elem;
}

window.addEventListener("load", function (event) {
  // check with local storage
  chrome.storage.local.get("monitoring", function (items) {
    var curr_url = window.location.host + "/" + window.location.pathname;
    var monitoring_regions = items.monitoring[curr_url];

    // if there is a record, fetch the element by index and compute hash
    if (monitoring_regions) {
      for (var i in monitoring_regions) {

      }
    }
  });

  // TODO: if there is a change on hash,
  //       send the update to the backend (through event page?)
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // TODO:
    //   selecting new region
  });

// TODO: listen on selecting new region event
// TODO: send adding new region event to event page
