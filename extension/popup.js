document.addEventListener("DOMContentLoaded", function () {
    const loginSection = document.getElementById("login-section");
    const scrapingSection = document.getElementById("scraping-section");

    // Check if the user is already logged in
    chrome.storage.local.get("isLoggedIn", function(data) {
        if (data.isLoggedIn) {
            showScrapingForm();
            fetchWebsites(data.token);  // Call fetch websites with the token
        }
    });

    document.getElementById("login-btn").addEventListener("click", async function () {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const response = await fetch('http://localhost:8080/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and login state
                chrome.storage.local.set({ isLoggedIn: true, token: data.token });

                // Show scraping form and fetch websites
                showScrapingForm();
                fetchWebsites(data.token);
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

    // Fetch websites after login
    async function fetchWebsites(token) {
        try {
            const response = await fetch('http://localhost:8080/websites', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const websites = await response.json();

            if (response.ok) {
                displayWebsites(websites);
            } else {
                alert("Failed to fetch websites. Please try again.");
            }
        } catch (error) {
            alert("An error occurred while fetching websites.");
            console.error(error);
        }
    }

    function displayWebsites(websites) {
        const dropdownContainer = document.getElementById("websites-dropdown");
        dropdownContainer.innerHTML = ''; // Clear existing content

        // Create a default option for the list
        const defaultItem = document.createElement("li");
        defaultItem.textContent = "Select a website";
        defaultItem.classList.add("disabled");
        dropdownContainer.appendChild(defaultItem);

        // Populate the list with website options
        websites.forEach(website => {
            const listItem = document.createElement("li");
            listItem.textContent = website.name;
            listItem.dataset.id = website.id;

            // Add click event to each item
            listItem.addEventListener("click", function() {
                alert("Website selected: " + website.name);
                chrome.storage.local.set({ selectedWebsite: website.id });
            });

            dropdownContainer.appendChild(listItem);
        });
    }

    // Send request to collect data when the button is clicked
    document.getElementById("send-request").addEventListener("click", function () {
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

        fetch('http://localhost:8081/collect', {
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

    document.getElementById("close-window").addEventListener("click", function () {
        chrome.windows.getCurrent(function(window) {
            chrome.windows.remove(window.id);
        });
    });
});
