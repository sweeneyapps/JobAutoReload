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
    }

    if (items.url != undefined){
      url.value = items.url;
    } else {
      url.value = DEFAULT_SOUND;
    }
  });
}

// use this in the future as reset function
function clearStorage(){
  chrome.storage.sync.clear();
}

document.addEventListener("DOMContentLoaded", function(event) {
  // clearStorage();  //debugging and reset
  update();
  document.getElementById("interval").onchange = saveIntervalChanges;
  document.getElementById("saveUrl").onclick = saveURLChanges;
});
