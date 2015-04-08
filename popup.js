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

function createLinkItem(url) {
  var link = document.createElement("a");
  link.href = url;
  link.innerHTML = url;
  link.addEventListener('click', function(e) {
    chrome.tabs.create({url:e.target.href});
  });
  return link;
}

function loadEvents() {
  chrome.runtime.sendMessage({
    event_type: "request_events",
  }, function (events) {
    console.log('feeding events in popup.html', events);
    var updated_list = document.getElementById('updated-regions');

    for (var i in events) {
      var link = createLinkItem(events[i].url);
      link.classList.add("list-group-item", "list-group-item-success");
      updated_list.appendChild(link);
    }
  });
}

function loadMonitoringRegions() {
  chrome.storage.local.get("monitors", function (items) {
    console.log('feeding monitoring regions in popup.html', items.monitors);
    var monitoring_list = document.getElementById("monitoring-regions");

    for (url in items.monitors) {
      var link = createLinkItem(url);
      link.classList.add("list-group-item");
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

