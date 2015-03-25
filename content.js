function buildURL(window) {
  return window.location.protocol + "//" + window.location.host + window.location.pathname;
}

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

function decodeDOM(breadcrumb_str) {
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

  if (text.length == 0) {
    return hash;
  }

  for (i = 0; i < text.length; i++) {
    c = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash = hash & hash;
  }

  return hash;
}

window.addEventListener("load", function (event) {
  // check with local storage
  chrome.storage.local.get("monitors", function (items) {
    var curr_url = buildURL(window);
    var regions = items.monitors[curr_url];

    if (regions) {
      console.log("[monitor] checking changes...");
      var changed_regions = [];

      // if there is a record, fetch the element by index and compute hash
      for (var i in regions) {
        var dom = decodeDOM(regions[i].index);
        var hash = hashCode(dom.innerHTML);

        if (hash != regions[i].hash_val) {
          changed_regions.push({index: regions[i].index, hash_val: hash});
        }
      }

      // if there is a change on hash,
      // send the updated regions to the event page
      if (changed_regions.length > 0) {
        console.log("[monitor] detecting changes...", changed_regions);

        chrome.runtime.sendMessage({
          event_type: "changed_regions",
          url: curr_url,
          regions: changed_regions
        });
      } else {
        console.log("[monitor] no changes have been detected.")
      }
    } else {
      console.log("[monitor] not a target.");
    }
  });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // TODO:
    //   selecting new region
  });


// TODO: send adding new region event to event page
