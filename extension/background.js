let scrapingWindowId = null;

chrome.browserAction.onClicked.addListener(function () {
    if (scrapingWindowId) {
        chrome.windows.update(scrapingWindowId, { focused: true });
        return;
    }

    chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        height: 600,
        width: 400,
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
