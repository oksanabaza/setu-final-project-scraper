document.addEventListener("DOMContentLoaded", function () {
  const loginSection = document.getElementById("login-section");
  const scrapingSection = document.getElementById("scraping-section");

  // Check if user is already logged in
  chrome.storage.local.get("isLoggedIn", function(data) {
      if (data.isLoggedIn) {
          showScrapingForm();
      }
  });

//   document.getElementById("login-btn").addEventListener("click", function () {
//       const email = document.getElementById("email").value.trim();
//       const password = document.getElementById("password").value.trim();

//       // Dummy login check
//       if (email === "admin@gmail.com" && password === "admin") {
//           chrome.storage.local.set({ isLoggedIn: true });
//           showScrapingForm();
//       } else {
//           alert("Invalid credentials!");
//       }
//   });
document.getElementById("login-btn").addEventListener("click", async function () {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const response = await fetch('http://localhost:8080/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            chrome.storage.local.set({ isLoggedIn: true, token: data.token });

            showScrapingForm();
        } else {
            alert(data.message || "Login failed. Please try again.");
        }
    } catch (error) {
        alert("An error occurred. Please try again.");
        console.error(error);
    }
});


  function showScrapingForm() {
      loginSection.classList.add("hidden");
      scrapingSection.classList.remove("hidden");
  }

  document.getElementById("send-request").addEventListener("click", function () {
      
      console.log("Send request button clicked!");

      const links = document.getElementById("links").value.split(',').map(url => url.trim());
      const titleXPath = document.getElementById("title").value.trim();
      const priceXPath = document.getElementById("price").value.trim();
      const descriptionXPath = document.getElementById("description").value.trim();
      
      console.log("Collected Data:", { links, titleXPath, priceXPath, descriptionXPath });

      const templateData = {
          links: links,
          elements: {
              "title": titleXPath,
              "price": priceXPath,
              "description": descriptionXPath
          },
          is_xpath: true
      };

      console.log("Sending Request:", JSON.stringify(templateData, null, 2));

      fetch('http://localhost:8080/collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData)
      })
      .then(response => response.json())
      .then(data => {
          console.log("Response received:", data);
          document.getElementById("response-text").textContent = JSON.stringify(data, null, 2);
          if (data.status === "success") {
              document.getElementById("close-window").classList.remove("hidden");
          }
      })
      .catch((error) => {
          console.error('Error:', error);
      });
  });

  document.getElementById("close-window").addEventListener("click", function () {
      chrome.windows.getCurrent(function(window) {
          chrome.windows.remove(window.id);
      });
  });
});
