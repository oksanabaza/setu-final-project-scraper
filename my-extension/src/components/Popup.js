/* global chrome */

import React, { useEffect, useState } from "react";
import Login from "./Login";
import { Layout, Typography, Button, Input, Select, Radio, Table, Card, Tooltip, Space,  Alert  } from "antd";
import { UserOutlined, LogoutOutlined, DeleteOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;


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
  const [templates, setTemplates] = useState([]);
  const [alertMessage, setAlertMessage] = useState(null);
  const [wrapper, setWrapper] = useState("");


  useEffect(() => {
    chrome.storage.local.get(["isLoggedIn", "token", "websites"], (data) => {
      if (data.isLoggedIn && data.token) {
        setIsLoggedIn(true);
        setToken(data.token);
        if (data.websites) {
          setWebsites(data.websites);
        } else {
          fetchWebsites(data.token);
          fetchTemplates(data.token);
        }
      }
    });
  }, []);

  const fetchTemplates = async (token) => {
    try {
      const response = await fetch("https://setu-final-project.onrender.com/templates", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        chrome.storage.local.set({ templates: data });
      } else {
        console.error("Failed to fetch templates.");
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };
  const handleDelete = async (id) => {
    try {
      await fetch(`https://setu-final-project.onrender.com/templates/${id}`, { method: "DELETE" });
      setTemplates(templates.filter((template) => template.id !== id));
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const handleLoginSuccess = (newToken) => {
    setIsLoggedIn(true);
    setToken(newToken);
    fetchWebsites(newToken);
    fetchTemplates(newToken)
  };

  const fetchWebsites = async (token) => {
    try {
      const response = await fetch("https://setu-final-project.onrender.com/websites", {
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
            is_xpath: false,
          },
          wrapper: wrapper,
          created_at: new Date().toISOString(),
        };
  
        const response = await fetch("https://setu-final-project.onrender.com/templates/create", {
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
          setAlertMessage({
            type: 'success',
            message: 'Template saved successfully!',
          });
        } else {
          setAlertMessage({
            type: 'error',
            message: 'Failed to save template',
          });
        }
      });
    } catch (error) {
      console.error("Error saving template:", error);
      setAlertMessage({
        type: 'error',
        message: 'Error',
        description: 'An error occurred while saving the template.',
      });
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
        is_xpath: false,
        type: scrapingLevel,
        wrapper: wrapper,
      };
  
      const response = await fetch("https://setu-final-project.onrender.com/scrape", {
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
    <Layout style={{  width: "100vw", background: "#ffffff" }}>
    <Header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src="/icon.png" alt="Logo" style={{ height: 40, marginRight: 10 }} />
        <Title level={3} style={{ color: "white", margin: 0 }}>ScrapeTrack</Title>
      </div>
      <Space>
        <Tooltip title="User Profile">
          <Button shape="circle" icon={<UserOutlined />} />
        </Tooltip>
        <Tooltip title="Logout">
          <Button shape="circle" icon={<LogoutOutlined />} onClick={() => setIsLoggedIn(false)} />
        </Tooltip>
      </Space>
    </Header>
    <Content style={{ padding: 20, display: "flex", justifyContent: "center", alignItems: "center" }}>
      {!isLoggedIn ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Card style={{ width: 400, padding: 20, boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" }}>
          {!showScrapingForm ? (
            <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <Button type="primary" onClick={() => setShowScrapingForm(true)}>New Template</Button>
              </div>
               <Table dataSource={templates} size="small" pagination={{ pageSize: 5 }}  columns={[
                { title: "Template Name", dataIndex: "name", key: "name" },
                { title: "Action", key: "action", render: () => <DeleteOutlined />}
              ]}  />
            </>
        
          ) : (
            <>
             {alertMessage && (
        <Alert
          message={alertMessage.message}
          description={alertMessage.description}
          type={alertMessage.type}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
              <Button onClick={() => setShowScrapingForm(false)}>Back</Button>
              <Input placeholder="Template Name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} style={{ marginBottom: 10 }} />
              <Radio.Group value={scrapingLevel} onChange={(e) => setScrapingLevel(e.target.value)}>
                <Radio value="detailed">Detailed</Radio>
                <Radio value="shallow">Shallow</Radio>
              </Radio.Group>
              <Select placeholder="Select a Website" value={selectedWebsite} onChange={setSelectedWebsite} style={{ width: "100%", marginBottom: 10 }}>
                {websites.map((website) => (
                  <Option key={website.id} value={website.id}>{website.name}</Option>
                ))}
              </Select>
              <Input placeholder="URLs (comma-separated)" value={links} onChange={(e) => setLinks(e.target.value)} style={{ marginBottom: 10 }} />
              <Input placeholder="Title XPath" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: 10 }} />
              <Input placeholder="Price XPath" value={price} onChange={(e) => setPrice(e.target.value)} style={{ marginBottom: 10 }} />
              <Input placeholder="Description XPath" value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginBottom: 10 }} />
              <Input placeholder="Wrapper" value={wrapper} onChange={(e) => setWrapper(e.target.value)} style={{ marginBottom: 10 }} 
/>
              <Button type="primary" onClick={handleSendRequest} style={{ marginTop: 10 }}>Send Request</Button>
            
              <Button style={{ marginTop: 10, marginLeft: 10 }}onClick={handleSaveTemplate} >Save Template</Button>
            </>
          )}
          {previewData && (
            <Card style={{ maxHeight: "400px",  maxWidth: "100%", overflowX: "auto", overflowY: "auto",fontSize: "12px", background: "#f0f0f0", padding: 10, borderRadius: 5,whiteSpace: "pre-wrap"  }}>
              <Title level={5}>Preview</Title>
              <pre>{JSON.stringify(previewData, null, 2)}</pre>
            </Card>
          )}
        </Card>
      )}
    </Content>
  </Layout>
  
  );
};

export default Popup;

