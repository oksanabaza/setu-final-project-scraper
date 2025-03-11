document.addEventListener("DOMContentLoaded", function () {
    const loginSection = document.getElementById("login-section");
    const scrapingSection = document.getElementById("scraping-section");
    const newBtn = document.getElementById("new-btn");
    const backBtn = document.getElementById("back-btn");
    const scrapingForm = document.getElementById("scraping-form");
    const table = document.getElementById("table");

    // Check if the user is already logged in
    chrome.storage.local.get("isLoggedIn", function (data) {
        if (data.isLoggedIn) {
            showScrapingForm();
            fetchWebsites(data.token);
        }
    });

    // Check for saved websites
    chrome.storage.local.get("websites", function (data) {
        if (data.websites) {
            displayWebsites(data.websites);
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

    // Show the scraping form when "New" is clicked
    newBtn.addEventListener("click", function () {
        newBtn.classList.add("hidden");  
        scrapingForm.classList.remove("hidden");  
        table.classList.add("hidden");
    });

    async function fetchWebsites(token) {
        chrome.storage.local.get("websites", function (data) {
            if (data.websites) {
                displayWebsites(data.websites);
            } else {
                fetchFromServer(token);
            }
        });
    }

    async function fetchFromServer(token) {
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
                chrome.storage.local.set({ websites: websites });
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
        dropdownContainer.innerHTML = ''; 
    
        // Default option
        const defaultItem = document.createElement("option");
        defaultItem.textContent = "Select a website";
        defaultItem.disabled = true;  
        defaultItem.selected = true; 
        dropdownContainer.appendChild(defaultItem);
    
        // Add websites to the dropdown
        websites.forEach(website => {
            const listItem = document.createElement("option");
            listItem.textContent = website.name;
            listItem.value = website.id; 
    
            dropdownContainer.appendChild(listItem);
        });
    
        // Add event listener for the dropdown change
        dropdownContainer.addEventListener("change", function () {
            const selectedOption = dropdownContainer.selectedOptions[0];
            const selectedWebsiteId = selectedOption.value;
            const selectedWebsiteName = selectedOption.textContent;
    
            alert("Website selected: " + selectedWebsiteName);
            chrome.storage.local.set({ selectedWebsite: selectedWebsiteId });
        });
    }

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
        chrome.windows.getCurrent(function (window) {
            chrome.windows.remove(window.id);
        });
    });

    backBtn.addEventListener("click", function () {
        loginSection.classList.add("hidden");
        scrapingSection.classList.remove("hidden");
        scrapingForm.classList.add("hidden");
        newBtn.classList.remove("hidden");
        table.classList.remove("hidden");
    });


    document.getElementById("save-template").addEventListener("click", function () {
        const templateName = document.getElementById("template-name").value.trim();
        const links = document.getElementById("links").value.trim();
        const title = document.getElementById("title").value.trim();
        const price = document.getElementById("price").value.trim();
        const description = document.getElementById("description").value.trim();
        const selectedLevel = document.querySelector('input[name="scraping-level"]:checked');
        const scrapingLevel = selectedLevel ? selectedLevel.value : '';
    
        if (!templateName || !links || !title || !price || !description || !scrapingLevel) {
            alert("Please fill in all fields and select a scraping level.");
            return;
        }
    
        const settings = {
            links: links.split(',').map(url => url.trim()),
            title: title,
            price: price,
            description: description,
            scrapingLevel: scrapingLevel
        };
    
        const templateData = {
            website_id: 1,
            user_id: 4,
            name: templateName,
            settings: settings,
            created_at: new Date().toISOString(),
            scraping_type: scrapingLevel
        };
    
        chrome.storage.local.get("token", function (data) {
            if (!data.token) {
                alert("Authentication token is missing. Please log in again.");
                return;
            }
    
            fetch('http://localhost:8080/templates/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.token}`
                },
                body: JSON.stringify(templateData),
            })
                .then(response => response.json())
                .then(data => {
                    console.log("Template saved successfully:", data);
                    alert("Template saved successfully!");
                })
                .catch(error => {
                    console.error("Error saving template:", error);
                    alert("There was an error saving the template.");
                });
        });
    });
    
 
});
