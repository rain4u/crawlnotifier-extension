// var SERVER_ENDPOINT = "http://localhost:9292/";
var SERVER_ENDPOINT = "https://quiet-ravine-7972.herokuapp.com/";

function requestEvents(args) {
  var xhr = new XMLHttpRequest();
  var url = SERVER_ENDPOINT + "events";

  if (args.start_at !== undefined) {
    url = url + "?start_at=" + args.start_at;
  }

  xhr.open("GET", url, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.responseText) {
        args.success(xhr, JSON.parse(xhr.responseText));
      } else if (args.error) {
        args.error(xhr);
      } else {
        console.error("requestEvents");
      }
    }
  };

  xhr.send();
}

function requestRegions(url, args) {
  var xhr = new XMLHttpRequest();
  var full_url = SERVER_ENDPOINT + "urls/" + encodeURIComponent(url);

  xhr.open("GET", full_url, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.responseText) {
        args.success(xhr, JSON.parse(xhr.responseText));
      } else if (args.error) {
        args.error(xhr);
      } else {
        console.error("requestRegions");
      }
    }
  };

  xhr.send();
}

function updateRegionsForUrl(url, regions) {
  var xhr = new XMLHttpRequest();
  var full_url = SERVER_ENDPOINT + "urls/" + encodeURIComponent(url);

  xhr.open("PUT", full_url, true);

  xhr.setRequestHeader("Content-type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status != 200 && xhr.status != 201) {
        console.error("updateRegionsForUrl");
      }
    }
  };

  xhr.send(JSON.stringify({regions: regions}));
}

/* Extension code */

var unread_count = 0;

function isEmpty(obj) {
  return !obj || (Object.getOwnPropertyNames(obj).length === 0);
}

function onInit() {
  // FIXME: for test purpose.
  /*chrome.storage.local.set({
    "monitors": {
      'http://itswindtw.github.io/': {
        '#net-info-container': { active: true, hash_val: 150675848 }
      }
    }
  });*/
  chrome.storage.local.set({ "monitors": {} });

  requestEvents({
    success: function (xhr, events) {
      // FIXME: for test purpose
      // chrome.storage.local.set({ last_event_id: 0 });
      chrome.storage.local.set({"last_event_id": events.paging.last});
    }
  });

  scheduleUpdate();
}

function scheduleUpdate() {
  chrome.alarms.create('refresh', { periodInMinutes: 1.0 });
}

var events_queue = [];

function refreshEvents() {
  // fetch backend's events
  // if changed, budge icon and send update event to popup.html
  console.log('refreshEvents');

  chrome.storage.local.get(["last_event_id", "monitors"], function (items) {
    requestEvents({
      start_at: items.last_event_id,
      success: function (xhr, events) {
        if (events.paging.last != items.last_event_id) {
          var changed_regions = [];
          var hashmap = {};

          for (var i = 0; i < events.data.length; i++) {

            var key = events.data[i].url + events.data[i].index;
            if (typeof hashmap[key] === 'undefined') hashmap[key] = true;
            else continue;

            if (!isEmpty(items.monitors[events.data[i].url])) {

              var region = items.monitors[events.data[i].url][events.data[i].index];

              if (region && region.active &&
                  region.hash_val != events.data[i].hash_val) {
                changed_regions.push(events.data[i]);
              } else if (!region || !region.active) {
                items.monitors[events.data[i].url][events.data[i].index] = {
                  active: false,
                  hash_val: events.data[i].hash_val
                };
              }
            }
          }
          
          events_queue = events_queue.concat(changed_regions);
          unread_count = changed_regions.length;
          if (unread_count > 0) {
            chrome.browserAction.setBadgeText({text: unread_count.toString()});
          }

          scheduleUpdate();

          chrome.storage.local.set({
            last_event_id: events.paging.end,
            monitors: items.monitors
          }, function () {
            if (events.paging.end != events.paging.last) {
              console.log("events have next page...requesting...");
              refreshEvents();
            }
          });
        } else {
          console.log('no change.');
        }
      }
    });
  });
}

function onAlarm(alarm) {
  refreshEvents();
}

function updateRegionsToMonitors(url, new_regions) {
  chrome.storage.local.get("monitors", function (items) {
    var regions = items.monitors[url];

    for (var i in new_regions) {
      regions[new_regions[i].index].hash_val = new_regions[i].hash_val;
    }

    chrome.storage.local.set({monitors: items.monitors});
  });
}

function insertRegionToMonitors(url, new_region, existing_regions) {
  // FIXME or IGNORE: potential race condition here?

  chrome.storage.local.get("monitors", function (items) {
    if (!items.monitors[url]) {
      items.monitors[url] = existing_regions;
    }

    var regions = items.monitors[url];
    regions[new_region.index] = {
      active: true,
      hash_val: new_region.hash_val
    };

    chrome.storage.local.set({ monitors: items.monitors });
  });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.event_type) {
      case 'changed_regions':
        updateRegionsToMonitors(request.url, request.regions);
        updateRegionsForUrl(request.url, request.regions);
        break;
      case 'refresh_events':
        refreshEvents();
        break;
      case 'add_region':
        insertRegionToMonitors(request.url, request.new_region, request.existing_regions);
        updateRegionsForUrl(request.url, [request.new_region]);
        break;
      case 'request_regions':
        // Use local data first, if none, go remote to fetch.
        chrome.storage.local.get("monitors", function (items) {
          console.log('request_regions');

          var local_regions = items.monitors[request.url];

          if (local_regions) {
            sendResponse(local_regions);
          } else {
            // request and transform data format
            requestRegions(request.url, {
              success: function (xhr, data) {
                var remote_regions = {};
                for (var i in data.regions) {
                  remote_regions[data.regions[i].index] = {
                    active: false, hash_val: data.regions[i].hash_val
                  };
                }
                sendResponse(remote_regions);
              }
            });
          }
        });
        break;
      case 'request_events':
        var published = events_queue.slice(0);
        events_queue.length = 0;
        chrome.browserAction.setBadgeText({text: ''});
        sendResponse(published);
        break;
    }

    return true;
  });

chrome.runtime.onInstalled.addListener(onInit);
chrome.alarms.onAlarm.addListener(onAlarm);
