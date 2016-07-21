
// app desc: Job Refresh for RainForest
// author: Paul Sweeney Jr


var appState = { workTab: null };
var color = {
    RED: [255,0,0,255],
    BLACK: [0,0,0,255],
    GREEN: [23,23,23,100]
};


var app = {
    timeout: null,
    running: false,
    HOW_LONG: 16 * 1000,

    toggleBadge: (on) => {
        if (!on) {
            chrome.browserAction.setBadgeBackgroundColor({color: color.BLACK});
            chrome.browserAction.setBadgeText({text: "OFF"});
        } else {
            chrome.browserAction.setBadgeBackgroundColor({color: color.RED}); // red
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
                app.toggleBadge(false);
                app.running = false;
                clearTimeout(app.timeout); // stop the loop
            }
        });

    },

    run: () => {

        app.getTabInfo();

        clearTimeout(app.timeout);
        app.timeout = setTimeout(app.run, app.HOW_LONG);
    },

    allStop: () => {  
        app.running = false;  
        clearTimeout(app.timeout); 
        app.toggleBadge(false);
    },

    getTabInfo: () => {
        chrome.tabs.query( {currentWindow: true, active: true, highlighted: true} , t => {
            if (chrome.runtime.lastError) {} // in case.. use later
            console.log(t[0].id);
            
            var re = /tester\.rainforestqa\.com\/tester\//;
            //  var re = /www\.vphreak\.net/;
            if(re.test(t[0].url)) {
                // it's rainforest job! :)
                console.log("rainforest tab found");
                appState.workTab = t[0];

                var code = "document.querySelector('div.warning-message > div').innerHTML";
                // var code = "document.querySelector('#hidden').innerHTML";
                
                chrome.tabs.executeScript(appState.workTab.id, {code: code}, (result) => {
                    
                    console.log(result);
                    var re = /no virtual machines currently available/;
                    var re2 = /Another worker accepted the job before you/;

                    if (re.test(result[0])) {
                        // no virtual machine still on screen
                        
                        // let reload the job
                        chrome.tabs.reload(appState.workTab.id);
                        console.log("found result!!");

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



            } else {
                alert("This is NOT rainforest Job!");
                app.allStop();
            }
        });
    }
};

app.setup();

/*

    div.warning-message > div    // css for warning message..  look up css reference.
       message: "There are no virtual machines currently available. Please retry in a few minutes."



*/
