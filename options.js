/*global chrome */

function setupCheck(name) {
    var check = document.getElementById(name);
    check.addEventListener('change', () => {
        console.log(`Setting ${name} to ${!!check.checked}`);
        chrome.storage.local.set({name: !!check.checked});
    });
    chrome.storage.local.get(name, (res) => {
        console.log(`${name} is ${!!res[name]}`);
        check.checked = !!res[name];
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupCheck('debug');
});
