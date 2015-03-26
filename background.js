var SERVER_ENDPOINT = "http://localhost:9292";

function requestEvents(args) {
  var xhr = new XMLHttpRequest();
  var url = SERVER_ENDPOINT + "/events";

  if (args.start_at != undefined) {
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
  }

  xhr.send();
}

function updateRegionsForUrl(url, regions) {
  var xhr = new XMLHttpRequest();
  var url = SERVER_ENDPOINT + "/urls/" + encodeURIComponent(url);

  xhr.open("PUT", url, true);

  xhr.setRequestHeader("Content-type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status != 200) {
        console.error("updateRegionsForUrl");
      }
    }
  }

  xhr.send(JSON.stringify({regions: regions}));
}


/* Extension code */

var unread_count = 0;

function isEmpty(obj) {
  return (Object.getOwnPropertyNames(obj).length == 0);
}

function onInit() {
  // FIXME: for test purpose.
  // chrome.storage.local.set({ "monitors": {} });
  chrome.storage.local.set({
    "monitors": {
      'http://itswindtw.github.io/': {
        '#net-info-container': { active: true, hash_val: 150675848 }
      }
    }
  });

  requestEvents({
    success: function (xhr, events) {
      // FIXME: for test purpose
      // chrome.storage.local.set({"last_event_id": events.paging.last});
      chrome.storage.local.set({"last_event_id": 0});//events.paging.last});
    }
  });

  scheduleUpdate();
}

function scheduleUpdate() {
  chrome.alarms.create('refresh', { periodInMinutes: 1.0 });
}


function refreshEvents() {
  // TODO: fetch backend's events
  //       if changed, budge icon and send update event to popup.html
  console.log('refreshEvents');

  chrome.storage.local.get(["last_event_id", "monitors"], function (items) {
    requestEvents({
      start_at: items.last_event_id,
      success: function (xhr, events) {
        if (events.paging.last != items.last_event_id) {
          var changed_regions = [];

          for (var i = events.data.length-1; i >= 0; --i) {
            if (!isEmpty(items.monitors[events.data[i].url])) {
              var region = items.monitors[events.data[i].url][events.data[i].index];

              if (region && region.active &&
                  region.hash_val != events.data[i].hash_val) {
                changed_regions.push(events.data[i]);
              }
            }
          }

          unread_count += changed_regions.length;
          chrome.browserAction.setBadgeText({text: unread_count.toString()});

          // TODO: publish changed events to popup

          scheduleUpdate();

          chrome.storage.local.set({"last_event_id": events.paging.end}, function () {
            if (events.paging.end != events.paging.last) {
              console.error("!?", events);
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

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.event_type) {
      case 'changed_regions':
        updateRegionsForUrl(request.url, request.regions);
        break;
      case 'refresh_events':
        refreshEvents();
        break;
    }

    // TODO:
    //   add region event
  });

chrome.runtime.onInstalled.addListener(onInit);
chrome.alarms.onAlarm.addListener(onAlarm);
