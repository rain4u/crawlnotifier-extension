/* utilities */

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

/* extension */

function checkContent() {
  // check with local storage
  chrome.storage.local.get("monitors", function (items) {
    var curr_url = buildURL(window);
    var regions = items.monitors[curr_url];

    if (regions) {
      console.log("[monitor] checking changes...");
      var changed_regions = [];

      // if there is a record, fetch the element by index and compute hash
      for (var key in regions) {
        var dom = decodeDOM(key);
        var hash = hashCode(dom.innerHTML);

        if (hash != regions[key].hash_val) {
          changed_regions.push({index: key, hash_val: hash});
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
}

function onMouseover(e) {
  var elem = e.target;

  if(!elem.classList.contains("crawl-hover")) {
    elem.classList.add("crawl-hover");
  }
}

function onMouseout(e) {
  var elem = e.target;

  if(elem.classList.contains("crawl-hover")) {
    elem.classList.remove("crawl-hover");
  }
}

function enterRegionSelection() {
  console.log('enterRegionSelection');

  document.getElementsByTagName('html')[0].classList.add('crawl-region-selection');
  document.addEventListener('mouseover', onMouseover);
  document.addEventListener('mouseout', onMouseout);
}

function exitRegionSelection() {
  console.log('exitRegionSelection');

  document.getElementsByTagName('html')[0].classList.remove('crawl-region-selection');
  document.removeEventListener('mouseover', onMouseover);
  document.removeEventListener('mouseout', onMouseout);
}

function registerEventDispatcher() {
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      switch (request.event_type) {
        case 'enter_region_selection':
          enterRegionSelection();
          break;
        case 'exit_region_selection':
          exitRegionSelection();
          break;
      }
    });
}

function onInit() {
  checkContent();
  registerEventDispatcher();
}



if (document.readyState == "complete") {
  onInit();
} else {
  window.addEventListener("load", onInit);
}



// TODO: send adding new region event to event page
