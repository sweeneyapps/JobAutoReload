const DEFAULT = 30;

function saveChanges(event) {
  var value = event.target.value;
  chrome.storage.sync.set({'interval': value}, function() {
    console.log("Settings saved!");
  });
}

function update() {
  var select = document.getElementById("interval");
  chrome.storage.sync.get("interval", function(items) {
    if (items.interval !== undefined) {
      select.value = items.interval;
    } else {
      select.value = DEFAULT;
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
  document.getElementById("interval").onchange = saveChanges;
});
