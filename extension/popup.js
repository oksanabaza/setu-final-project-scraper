document.getElementById("send-request").addEventListener("click", function() {
  const links = document.getElementById("links").value.split(',').map(url => url.trim());
  const titleXPath = document.getElementById("title").value.trim();
  const priceXPath = document.getElementById("price").value.trim();
  const descriptionXPath = document.getElementById("description").value.trim();

  const templateData = {
    links: links,
    elements: {
      "title": titleXPath,
      "price": priceXPath,
      "description": descriptionXPath
    },
    is_xpath: true
  };

  fetch('http://localhost:8080/collect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(templateData)
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById("response-text").textContent = JSON.stringify(data, null, 2);

    if (data.status === "success") {
      document.getElementById("close-window").classList.remove("hidden");
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
});

document.getElementById("close-window").addEventListener("click", function() {
  chrome.windows.getCurrent(function(window) {
      chrome.windows.remove(window.id);
  });
});
