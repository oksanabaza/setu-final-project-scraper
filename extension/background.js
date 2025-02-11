chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sendHTML") {
        console.log("Получен HTML:", message.data);

        fetch("http://localhost:8080/collect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html: message.data })
        })
        .then(response => response.json())
        .then(data => console.log("Ответ сервера:", data))
        .catch(error => console.error("Ошибка:", error));
    }
});
