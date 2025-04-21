/* global chrome */
import React, { useState, useEffect } from "react";
import { Form, Input, Button, Alert, Typography } from "antd";

const { Title } = Typography;

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.style.backgroundColor = "#001529";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.height = "100vh";

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch("https://setu-final-project.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        chrome.storage.local.set(
          { isLoggedIn: true, token: data.token, user_id: data.user_id },
          () => {
            onLoginSuccess(data.token);
          }
        );
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error(error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <Title level={2} style={{ textAlign: "center", color: "#001529" }}>
          Login
        </Title>
        {error && <Alert message={error} type="error" showIcon />}
        <Form onFinish={handleLogin} layout="vertical">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email" 
            />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter your password!" }]}
          >
            <Input.Password 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter your password" 
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" block htmlType="submit">
              Login
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw", 
    background: "#001529",
    boxSizing: "border-box",
    margin: 0,
    padding: 0,
    position: "fixed",
    top: 0,
    left: 0,
  },
  formContainer: {
    width: "80%",
    maxWidth: "400px",
    padding: "20px",
    background: "#f0f2f5",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    boxSizing: "border-box",
  },
};


export default Login;
