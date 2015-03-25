/* Code related to backend */
var SERVER_ENDPOINT = "http://localhost:9292";

function requestEvents(callback) {
  var xhr = new XMLHttpRequest();

  xhr.open("GET", SERVER_ENDPOINT + "/events", true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.responseText) {
      callback(JSON.parse(xhr.responseText));
    }
  }
  xhr.send();
}

/* Extension code */

function onInit() {
  // TODO: set up cursor

  requestEvents(function (resp) {


  });
}

function refreshEvents() {
  scheduleUpdate();

  // TODO: fetch backend's events
  //       if changed, budge icon and send update event to popup.html
}

function scheduleUpdate() {
  chrome.alarms.create('refresh', { periodInMinutes: 5.0 });
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

chrome.runtime.onInstalled.addListener(onAlarm);
chrome.alarms.onAlarm.addListener(onAlarm);
