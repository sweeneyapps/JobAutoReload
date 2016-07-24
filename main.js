
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
    HOW_LONG: 20 * 1000, // 20 seconds refresh rate.

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


    // setup Chrome Events

    setupEvents: () => {
        
        
        chrome.idle.setDetectionInterval(60);
        chrome.idle.onStateChanged.addListener(state => { 
            if (state !== "active") {
                if (app.running) {
                     app.allStop();  // idle or locked more than 1 minutes..  forget it  (Be fair to other workers)
                }
            }
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
            // var re = /tester\.rainforestqa\.com\/tester\//;
               var re = /http/;

           
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
       // var code = "document.querySelector('div.warning-message > div').innerHTML";
        // var code = "document.body.innerHTML";
           var code = "document.querySelector('body').innerHTML";

        chrome.tabs.executeScript(appState.workTab.id, {code: code}, (result) => {
                    if (chrome.runtime.lastError) {  
                        console.log("error happened.. " + chrome.runtime.lastError.message);
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
                 console.log("still running");
                 clearTimeout(app.timeout);
                 app.timeout = setTimeout(app.checkAndReload, app.HOW_LONG);
            }
           
    }
};



app.setup();  // launch point for Chrome Extension to load.

