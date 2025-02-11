console.log("HTML Extractor Loaded");

function extractHTML() {
    return document.documentElement.outerHTML;
}

chrome.runtime.sendMessage({ action: "sendHTML", data: extractHTML() });
