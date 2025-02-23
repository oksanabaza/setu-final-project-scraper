document.getElementById("send-request").addEventListener("click", function() {
    // Capture user input
    const links = document.getElementById("links").value.split(',').map(url => url.trim());
    const titleXPath = document.getElementById("title").value.trim();
    const priceXPath = document.getElementById("price").value.trim();
    const descriptionXPath = document.getElementById("description").value.trim();
  
    // Build the template data dynamically from user input
    const templateData = {
      links: links,
      elements: {
        "title": titleXPath,
        "price": priceXPath,
        "description": descriptionXPath
      },
      is_xpath: true
    };
  
    // Send the request with the template data
    fetch('http://localhost:8080/collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData)
    })
    .then(response => response.json())
    .then(data => {
      // Display the response
      document.getElementById("response-text").textContent = JSON.stringify(data, null, 2);
      
      // Show save button if successful
      if (data.status === "success") {
        document.getElementById("save-template").style.display = "inline-block";
        document.getElementById("save-template").onclick = function() {
          // Handle template saving (e.g., local storage or backend in the future)
          alert("Template saved!");
        };
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  });
  