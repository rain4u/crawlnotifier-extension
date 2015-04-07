function enterRegionSelection() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      event_type: "enter_region_selection"
    });
  });

  window.close();
  return false;
}

function exitRegionSelection() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      event_type: "exit_region_selection"
    });
  });

  window.close();
  return false;
}

function loadEvents() {
  chrome.runtime.sendMessage({
    event_type: "request_events",
  }, function (events) {
    console.log('feeding events in popup.html', events);
    var table = document.getElementById('events');

    for (var i in events) {
      var row = table.insertRow(-1);
      row.innerHTML = events[i].url;
    }
  });
}

function loadMonitoringRegions() {
  var monitoring_list = document.getElementById("monitoring-regions");

  chrome.storage.local.get("monitors", function (items) {
    for (url in items.monitors) {
      var link = document.createElement("a");

      link.className = "list-group-item";
      link.href = url;
      link.innerHTML = url;

      link.addEventListener('click', function(e) {
        chrome.tabs.create({url:e.target.href});
      });
      
      monitoring_list.appendChild(link);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var enter_btn = document.getElementById('enter-region-selection');
  var exit_btn = document.getElementById('exit-region-selection');

  enter_btn.addEventListener('click', enterRegionSelection);
  exit_btn.addEventListener('click', exitRegionSelection);

  loadEvents();
  loadMonitoringRegions();
});

