chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      height: 600,
      width: 400,
      focused: true
    });
  });
  