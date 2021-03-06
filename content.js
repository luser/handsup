/*global document chrome setTimeout btoa*/

var log = console.log; //(_) => {};
function setDebug(debug) {
    debug = !!debug;
    log = debug ? console.log : (_) => {};
    log(`Debug logging: ${debug}`);
}

var i = null;
var hangupButton = null;
var room = null;
var name = null;
var email = null;

chrome.storage.local.get(['debug'], ({debug}) => setDebug(debug));

chrome.storage.onChanged.addListener((changes, namespace) => {
    for (var key in changes) {
        if (key == 'debug') {
            setDebug(changes[key].newValue);
        }
    }
});

// Locate username by selector. Keep trying if it can't be found.
function findUsername() {
    let a = document.querySelector('a[ href^="https://accounts.google.com/AccountChooser?"]');
    if (a) {
        let userDiv = a.previousElementSibling;
        if (userDiv) {
            name = userDiv.title;
            email = userDiv.textContent;
        }
    }

    if (name && email) {
        log(`found name: ${name}, email: ${email}`);
    } else {
        setTimeout(findUsername, 100);
    }
}

async function shouldJoin(room) {
    let response = await fetch("https://jumbo-thorough-tenrec.gigalixirapp.com/room/" + room);
    let responseAsText = await response.text();
    console.log(`shouldJoin: ${responseAsText}`);
    return responseAsText === 'true';
}

function startHandRaiser() {
    if (i) {
        // Already open
        return;
    }
    i = document.createElement("iframe");
    i.style.width = "300px";
    i.style.height = "calc(100% - 200px)";
    let url = "https://youthful-joliot-d7b4b3.netlify.com/";
    if (name) {
        url += `#${btoa(JSON.stringify({ room: room, person: name }))}`;
    }
    i.src = url;
    i.style.zIndex = 999;
    i.style.position = "fixed";
    document.body.append(i);
    function popoutFn(a) {
        // console.log("postmessage data event", a);
        if (a && a.data && a.data.hands_popout) {
            console.log("timeout", i);
            i.parentNode.removeChild(i);
            window.removeEventListener("message", popoutFn);
        }
    }
    window.addEventListener("message", popoutFn, false);
}

function joinedMeeting() {
    console.log('Joined meeting!');
    if (room) {
        new Promise(async (resolve, reject) => {
            if (await shouldJoin(room)) {
                startHandRaiser();
            }
        });
    }
}

function leftMeeting() {
    console.log('Left meeting!');
    if (i) {
        document.body.removeChild(i);
        i = null;
    }
}

function checkMeetingStatus() {
    if (hangupButton == null) {
        hangupButton = document.querySelector('div[data-tooltip="Leave call"]');
        if (hangupButton != null) {
            joinedMeeting();
        }
    } else {
        if (!document.contains(hangupButton)) {
            hangupButton = null;
            leftMeeting();
        }
    }
    return hangupButton != null;
}

// Don't bother running this unless we're at a meeting URL
if (window.location.pathname != '/') {
    chrome.runtime.sendMessage(null, "showAction");
    const splits = window.location.pathname.split("/");
    room = splits[splits.length - 1];
    findUsername();
    window.setInterval(checkMeetingStatus, 1000);
}

chrome.runtime.onMessage.addListener((message, sender, _) => {
    console.log(`Got message '${message}'`);
    if (message == "join") {
        startHandRaiser();
    }
});
