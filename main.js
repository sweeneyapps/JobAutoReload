
// app desc: Job Refresh for RainForest
// author: Paul Sweeney Jr


var appState = { workTab: null };
var color = {
    RED: [255,0,0,255],
    BLACK: [0,0,0,255],
    GREEN: [0,255,0,255]
};


var app = {
    timeout: null,
    running: false,
    HOW_LONG: 16 * 1000, // need test server response.  If too many request, increase to 20 seconds

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
        app.setupEvents(); 
        app.toggleBadge(false);
    },

    setupEvents: () => {
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

    run: () => {

        app.getTabInfoAndReload();

    },

    allStop: () => {  
        app.running = false;  
        clearTimeout(app.timeout); 
        app.toggleBadge(false);
    },

    getTabInfoAndReload: () => {
        chrome.tabs.query( {currentWindow: true, active: true, highlighted: true} , t => {
            if (chrome.runtime.lastError) {} // in case if needed... can use it later
        
            // regEx to check Rainforest Job URL
            var re = /tester\.rainforestqa\.com\/tester\//;
           
            if(re.test(t[0].url)) {
                // it's rainforest job! :)
                appState.workTab = t[0];

                app.checkAndReload(); // loop until found

            } else {
                alert("This is NOT rainforest Job!, please only use rainforest job tab");
                app.allStop();
            }
        });
    },

    checkAndReload: () => {
        // capture warning message on rainforest job page
        var code = "document.querySelector('div.warning-message > div').innerHTML";
                    
        chrome.tabs.executeScript(appState.workTab.id, {code: code}, (result) => {
                    if (chrome.runtime.lastError) {  app.allStop(); }

                    
                    var re = /no virtual machines currently available/;
                    var re2 = /Another worker accepted the job before you/;

                    if (re.test(result[0])) {
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

            clearTimeout(app.timeout);
            app.timeout = setTimeout(app.checkAndReload, app.HOW_LONG);
    }
};



app.setup();  // launch point for Chrome Extension to load.

