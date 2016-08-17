
// app desc: Job Refresh for RainForest
// author: Paul Sweeney Jr


var appState = { workTab: null };
var color = {
  BLACK: [0,0,0,255],
  GREEN: [0,255,0,255]
};

var app = {
  timeout: null,
  running: false,
  HOW_LONG: 30 * 1000, // 30 seconds refresh rate. (DEFAULT)
  SOUND_URL: "http://www.soundjay.com/button/beep-02.mp3", // default
  audioPlayer: null,

  toggleBadge: (on) => {
    if (!on) {
      chrome.browserAction.setBadgeBackgroundColor({color: color.BLACK});
      chrome.browserAction.setBadgeText({text: "OFF"});
    } else {
      chrome.browserAction.setBadgeBackgroundColor({color: color.GREEN}); 
      chrome.browserAction.setBadgeText({text: "ON"});     
    } 
  },

  setup: () => { 
    chrome.storage.sync.get("interval", function(items) {
      if (items.interval !== undefined) {
        app.HOW_LONG = items.interval * 1000;
      }
    });
    chrome.storage.sync.get("url", function(items) {
      if (items.url !== undefined) {
        app.SOUND_URL = items.url;
        app.audioPlayer = new Audio(app.SOUND_URL);
      }
    });
    app.setupEvents(); 
    app.toggleBadge(false);
  },

  // setup Chrome Events
  setupEvents: () => {   
    // listening to rainforest job tabs
    chrome.tabs.onCreated.addListener( tabs => {
      const re = /tester\.rainforestqa\.com\/tester\//; 
      if (re.test(tabs.url)) {
        app.audioPlayer.play();
      }
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (changes["interval"] !== undefined) {
        var seconds = changes["interval"].newValue;
        app.HOW_LONG = seconds * 1000; 
      }

      if (changes["url"] !== undefined) {
        var soundURL = changes["url"].newValue;
        app.SOUND_URL = soundURL;
        app.audioPlayer = new Audio(app.SOUND_URL);
      }  
    });

    chrome.idle.setDetectionInterval(120);
    chrome.idle.onStateChanged.addListener(state => { 
      if (state !== "active") {
        if (app.running) {
          app.allStop();  // idle or locked more than 2 minutes..  forget it  (Be fair to other workers)
        }
      }
    });

    // make your life easier w/ math step
    chrome.commands.onCommand.addListener( command => {
      if (command !== "add-this-string") return;
      chrome.tabs.query({currentWindow: true, active: true, highlighted: true}, t =>   {
        if (chrome.runtime.lastError) {} // in case if needed... can use it later
        var code = "document.querySelector('body').innerHTML";
        chrome.tabs.executeScript(t.id, {code: code}, result => {
          var re = /Add \d{3} and \d{3} using a calculator\./; 
          if (re.test(result[0])) {
            var mathString = re.exec(result[0]); // get the math string from the html body
            var digits = mathString[0].match(/\d{3}/g); // get 2 digits out of the math string
            var answer = parseInt(digits[0]) + parseInt(digits[1]);
            if (answer) {
              var msg = `${digits[0]} + ${digits[1]} = ${answer}`;
              alert(msg);
            }
          }
        });
      });
    });
      
    chrome.browserAction.onClicked.addListener( () => {
      app.running = !app.running;
      if(app.running){
        app.toggleBadge(true);
        app.run();
      } else {
        app.allStop();
      }
    });

  },

  // run the program
  run: () => {
    app.getTabInfoAndReload();
  },

  // stop the program
  allStop: () => {  
    app.running = false;  
    clearTimeout(app.timeout); 
    app.toggleBadge(false);
  },

  // check to see if current tab is an actual Rainforest job!
  getTabInfoAndReload: () => {
    chrome.tabs.query( {currentWindow: true, active: true, highlighted: true} , t => {
      if (chrome.runtime.lastError) {} // in case if needed... can use it later  
      
      // regEx to check Rainforest Job URL
      var re = /tester\.rainforestqa\.com\/tester\//;
     
      if(re.test(t[0].url)) {
        // it's rainforest job! :)
        appState.workTab = t[0];
        app.checkAndReload(true); // loop until found
      } else {
        alert("This is NOT rainforest Job!, please only use rainforest job tab");
        app.allStop();
      }
    });
  },


  // main part of the program (run loop)
  checkAndReload: () => {
    // capture warning message on rainforest job page
    var code = "document.querySelector('body').innerHTML";

    chrome.tabs.executeScript(appState.workTab.id, {code: code}, (result) => {
      if (chrome.runtime.lastError) {  
        console.warn("error happened.. " + chrome.runtime.lastError.message);
        app.allStop();
        return;
      }

      var re  = /no virtual machines currently available/i;
      var re2 = /Another worker accepted the job before you/i;
      var re3 = /Rate limit exceeded/i;

      if (re.test(result[0]) || re3.test(result[0])) {
        // "no virtual machine" message still on screen
        
        // let reload the job
        chrome.tabs.reload(appState.workTab.id);

      } else if (re2.test(result[0])) {
        // another worker accepted the job :(
        app.allStop();
        alert("Sorry, another worker accepted the job before you!");
        chrome.tabs.update(appState.workTab.id, {highlighted: true});

      } else {
        app.allStop();
        alert("Virtual Machine might be BACK!");
        chrome.tabs.update(appState.workTab.id, {highlighted: true});
      }
    });

    // loop until virtual machine errors disappears.
    if (app.running) {
      console.count("still running");
      clearTimeout(app.timeout);
      app.timeout = setTimeout(app.checkAndReload, app.HOW_LONG);
    }
  },

};

app.setup();  // launch point for Chrome Extension to load.

