const DEFAULT = 30;
const DEFAULT_SOUND = "http://www.soundjay.com/button/beep-02.mp3";
const select = document.getElementById("interval");
const url = document.getElementById("url");

function saveIntervalChanges(event) {
  var value = event.target.value;
  chrome.storage.sync.set({'interval': value}, function() {
    console.log("Settings saved!");
  });
}

function saveURLChanges(event) {
  var value = url.value;
  chrome.storage.sync.set({'url': value}, function() {
    console.log("Settings saved!");
  });
}

function update() {
  
  chrome.storage.sync.get(["url", "interval"], function(items) {

    if (items.interval !== undefined) {
      select.value = items.interval;
    } else {
      select.value = DEFAULT;
      chrome.storage.sync.set({'interval': select.value});
    }

    if (items.url != undefined){
      url.value = items.url;
    } else {
      url.value = DEFAULT_SOUND;
      chrome.storage.sync.set({'url': url.value});
    }
  });
}

function resetSettings() {
  chrome.storage.sync.clear(function(){ 
    update(); 
  });
}

document.addEventListener("DOMContentLoaded", function(event) {
  update();
  document.getElementById("interval").onchange = saveIntervalChanges;
  document.getElementById("saveUrl").onclick = saveURLChanges;
  document.getElementById("reset").onclick = resetSettings;
});
