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

/* Extension code */

var unread_count = 0;

function onInit() {
  chrome.storage.local.set({ "monitoring": {} });
  requestEvents({
    success: function (xhr, events) {
      chrome.storage.local.set({"last_event_id": events.paging.last});
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

  chrome.storage.local.get(["last_event_id", "monitoring"], function (items) {
    requestEvents({
      start_at: items.last_event_id,
      success: function (xhr, events) {
        if (events.paging.last != items.last_event_id) {
          var changed_regions = [];

          for (var i = events.data.length-1; i >= 0; --i) {
            if (items.monitoring[events[i].url]) {
              var regions = items.monitoring[events[i].url];
              var region_idx = regions.indexOf(events[i].index);

              if (region_idx != -1 &&
                regions[region_idx].active &&
                regions[region_idx].hash_val != events[i].hash_val) {
                changed_regions.push(events[i]);
              }
            }
          }

          unread_count += changed_regions.length;
          chrome.browserAction.setBadgeText({text: unread_count.toString()});
          console.log(changed_regions);

          // TODO: publish changed events to popup

          scheduleUpdate();

          chrome.storage.local.set({"last_event_id": events.paging.end}, function () {
            if (events.paging.end != events.paging.last) {
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
    // TODO:
    //   refresh event
    //   add region event
    //   update region event
  });

chrome.runtime.onInstalled.addListener(onInit);
chrome.alarms.onAlarm.addListener(onAlarm);
