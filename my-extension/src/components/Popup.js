/* global chrome */

import React, { useEffect, useState } from "react";
import Login from "./Login";

const Popup = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [showScrapingForm, setShowScrapingForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [scrapingLevel, setScrapingLevel] = useState("detailed");
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [links, setLinks] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [responseText, setResponseText] = useState(null);


  useEffect(() => {
    chrome.storage.local.get(["isLoggedIn", "token", "websites"], (data) => {
      if (data.isLoggedIn && data.token) {
        setIsLoggedIn(true);
        setToken(data.token);
        if (data.websites) {
          setWebsites(data.websites);
        } else {
          fetchWebsites(data.token);
        }
      }
    });
  }, []);

  const handleLoginSuccess = (newToken) => {
    setIsLoggedIn(true);
    setToken(newToken);
    fetchWebsites(newToken);
  };

  const fetchWebsites = async (token) => {
    try {
      const response = await fetch("http://localhost:8080/websites", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWebsites(data);
        chrome.storage.local.set({ websites: data });
      } else {
        console.error("Failed to fetch websites.");
      }
    } catch (error) {
      console.error("Error fetching websites:", error);
    }
  };

  const handleNewTemplate = () => {
    setShowScrapingForm(true);
    setShowPreview(false);
  };

  const handleBack = () => {
    setShowScrapingForm(false);
    setShowPreview(false);
  };

  const handleSaveTemplate = async () => {
    const linksArray = links.split(",").map(url => url.trim());
  
    try {
      chrome.storage.local.get(["token", "user_id"], async function (result) {
        const token = result.token;
        const user_id = result.user_id; 
  
        if (!token) {
          console.error("No token found! Please log in first.");
          return;
        }
        if (!user_id) {
          console.error("No user ID found! Ensure the user is logged in.");
          return;
        }
  
        const website_id = selectedWebsite;
        
        if (!website_id || website_id <= 0) {
          console.error("Invalid website ID. Please select a valid website.");
          return;
        }
  
        const templateData = {
          website_id: website_id, 
          user_id: user_id,
          name: templateName,
          scraping_type: scrapingLevel,
          settings: {
            links: linksArray,
            elements: {
              title: title.trim(),
              price: price.trim(),
              description: description.trim(),
            },
            is_xpath: true,
          },
          created_at: new Date().toISOString(),
        };
  
        const response = await fetch("http://localhost:8080/templates/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(templateData),
        });
  
        const data = await response.json();
        console.log("Template saved and sent:", data);
  
        if (response.ok) {
          alert("Template saved successfully!");
        } else {
          console.error("Failed to save template:", data);
        }
      });
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };
  
  
  

  const handleSendRequest = async () => {
    try {
      const requestBody = {
        links: links.split(","),
        elements: {
          title,
          price,
          description,
        },
        is_xpath: true,
        type: scrapingLevel, 
      };
  
      const response = await fetch("http://localhost:8080/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
  
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        setShowPreview(true);
      } else {
        console.error("Failed to scrape data.");
      }
    } catch (error) {
      console.error("Error sending scrape request:", error);
    }
  };
  console.log("Selected Website ID:", selectedWebsite);


  return (
    <div style={{ width: "360px", padding: "20px" }}>
      {!isLoggedIn ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div>
          {!showScrapingForm ? (
            <div>
              <h4>Scraping Tool</h4>
              <button onClick={handleNewTemplate} className="btn">
                New
              </button>
              <table className="striped">
                <thead>
                  <tr>
                    <th>Template Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mock data, will be replaced with dynamic data */}
                  <tr>
                    <td>Template 1</td>
                    <td>
                      <button className="btn red btn-small">Edit</button>
                    </td>
                    <td>
                      <button className="btn red btn-small">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <button onClick={handleBack} className="btn">
                Back
              </button>
              <div>
                <input
                  type="text"
                  placeholder="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div>
                <label>
                  <input
                    type="radio"
                    name="scraping-level"
                    value="detailed"
                    checked={scrapingLevel === "detailed"}
                    onChange={() => setScrapingLevel("detailed")}
                  />
                  <span>Detailed</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="scraping-level"
                    value="shallow"
                    checked={scrapingLevel === "shallow"}
                    onChange={() => setScrapingLevel("shallow")}
                  />
                  <span>Shallow</span>
                </label>
              </div>
              <div>
                <select
                  value={selectedWebsite || ""}  
                  onChange={(e) => setSelectedWebsite(Number(e.target.value))}  
                >
                  <option value="" disabled>
                    Select a website
                  </option>
                  {websites.map((website) => (
                    <option key={website.id} value={website.id}>
                      {website.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="URLs (comma-separated)"
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Title XPath"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Price XPath"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Description XPath"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <button onClick={handleSendRequest} className="btn blue">
                Send Request Here
              </button>
              <button onClick={handleSaveTemplate} className="btn green">
                Save Template
              </button>
            </div>
          )}
          {showPreview && previewData && (
            <div>
              <h4>Preview</h4>
              <pre style={{ background: "#f4f4f4", padding: "10px" }}>
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Popup;

