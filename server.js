const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const path = require("path"); // ✅ Import path module

const app = express();
const PORT = 3000;

// ✅ Fix CORS settings to allow Render-hosted frontend
app.use(cors({
  origin: ["https://your-render-project.onrender.com"],
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use(cookieParser());

// ✅ Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// ✅ Default route to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// **Signup Route**
app.post("/signup", async (req, res) => {
  console.log("Signup Request Received:", req.body);

  try {
    // User registration logic...
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// **Login Route**
app.post("/login", async (req, res) => {
  console.log("Login request received:", req.body);

  try {
    // Login logic...
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// **Start Server**
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));