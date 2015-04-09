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

function createLinkItem(url, region_number) {
  var link = document.createElement("a");
  link.href = url;
  link.innerHTML = url + '<span class="badge">' + region_number + '</span>';
  link.addEventListener('click', function(e) {
    chrome.tabs.create({url:e.target.href});
  });
  return link;
}

function groupEvents(events) {
  var grouped_events = {}; // {url: region_number}
  for (var i in events) {
    if (typeof grouped_events[events[i].url] === 'undefined') grouped_events[events[i].url] = 0;
    grouped_events[events[i].url]++;
  }
  return grouped_events;
}

function loadEvents() {
  chrome.runtime.sendMessage({
    event_type: "request_events",
  }, function (events) {
    console.log('feeding events in popup.html', events);
    var updated_list = document.getElementById('updated-regions');
    var grouped_events = groupEvents(events); // {url: region_number}

    for (var url in grouped_events) {
      var link = createLinkItem(url, grouped_events[url]);
      link.classList.add("list-group-item", "list-group-item-success");
      updated_list.appendChild(link);
    }
  });
}

function activeRegionNumber(regions) {
  var region_number = 0;
  for (var region in regions) {
    if (regions[region].active) region_number++;
  }
  return region_number;
}

function loadMonitoringRegions() {
  chrome.storage.local.get("monitors", function (items) {
    console.log('feeding monitoring regions in popup.html', items.monitors);
    var monitoring_list = document.getElementById("monitoring-regions");

    for (url in items.monitors) {
      var link = createLinkItem(url, activeRegionNumber(items.monitors[url]));
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

