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
        console.log("[monitor] no changes have been detected.");
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

    if (elem.classList.length === 0) {
      elem.removeAttribute('class');
    }
  }
}

function onClick(e) {
  var elem = e.target;
  var curr_url = buildURL(window);

  onMouseout(e);
  exitRegionSelection();

  requestRegisteredRegions(function (regions) {
    var index = encodeDOM(elem);
    var hash_val = hashCode(elem.innerHTML);

    chrome.runtime.sendMessage({
      event_type: "add_region",
      url: curr_url,
      new_region: {
        index: index,
        hash_val: hash_val
      },
      existing_regions: regions
    });

    registered_regions[index] = { active: true, hash_val: hash_val };

    alert("success!");
  });

  return false;
}

function onKeyup(e) {
  if (e.keyCode == 27) { // 27 is for "ESC"
   
    // according to design, there should always be only one crawl-hover 
    var hover_elem = document.getElementsByClassName('crawl-hover')[0];
    hover_elem.classList.remove("crawl-hover");

    exitRegionSelection(); 
  }
}


var registered_regions = null;

function requestRegisteredRegions(callback) {
  if (registered_regions) {
    callback(registered_regions);
  } else {
    var curr_url = buildURL(window);

    chrome.runtime.sendMessage({
      event_type: "request_regions",
      url: curr_url
    }, function (regions) {
      registered_regions = regions;
      callback(regions);
    });
  }
}

var tagged_dom_indexes = [];

function enterRegionSelection() {
  console.log('enterRegionSelection');
  
  document.getElementsByTagName('html')[0].classList.add('crawl-region-selection');
  document.addEventListener('mouseover', onMouseover);
  document.addEventListener('mouseout', onMouseout);
  document.addEventListener('click', onClick);
  document.addEventListener('keyup', onKeyup);

  requestRegisteredRegions(function (regions) {
    for (var index in regions) {
      if (regions.hasOwnProperty(index)) {
        var dom = decodeDOM(index);

        if (regions[index].active) {
          dom.classList.add('crawl-monitored-self');
        } else {
          dom.classList.add('crawl-monitored-other');
        }

        tagged_dom_indexes.push(index);
      }
    }
  });
}

function exitRegionSelection() {
  console.log('exitRegionSelection');

  var html_elem = document.getElementsByTagName('html')[0];
  html_elem.classList.remove('crawl-region-selection');
  if (html_elem.classList.length === 0) {
    html_elem.removeAttribute('class');
  }

  document.removeEventListener('mouseover', onMouseover);
  document.removeEventListener('mouseout', onMouseout);
  document.removeEventListener('click', onClick);
  document.removeEventListener('keyup', onKeyup);

  for (var i in tagged_dom_indexes) {
    var dom = decodeDOM(tagged_dom_indexes[i]);

    dom.classList.remove('crawl-monitored-self');
    dom.classList.remove('crawl-monitored-other');

    if (dom.classList.length === 0) {
      dom.removeAttribute('class');
    }
  }

  tagged_dom_indexes.length = 0;
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
