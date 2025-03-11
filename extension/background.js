let scrapingWindowId = null;

chrome.action.onClicked.addListener(() => {
    if (scrapingWindowId) {
        chrome.windows.update(scrapingWindowId, { focused: true });
        return;
    }

    chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        width: 400,
        height: 600,
        focused: true
    }, function (window) {
        scrapingWindowId = window.id;
    });

    chrome.windows.onRemoved.addListener(function (closedWindowId) {
        if (closedWindowId === scrapingWindowId) {
            scrapingWindowId = null;
        }
    });
});
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ loggedIn: false }); 
});