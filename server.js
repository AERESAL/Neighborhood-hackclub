const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const app = express();
const PORT = 3000;

// ✅ Debug: Log server startup
console.log("🟢 Server starting...");

// ✅ Fix CORS settings
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500", "https://volunteerhub-qfkx.onrender.com"],
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Debug: Ensure JSON storage exists
const usersFile = "users.json";
if (!fs.existsSync(usersFile)) {
  console.log("🟡 Creating users.json...");
  fs.writeFileSync(usersFile, JSON.stringify({}, null, 2));
}
let users = JSON.parse(fs.readFileSync(usersFile, "utf8"));

// ✅ Serve index.html
app.get("/", (req, res) => {
  console.log("✅ Serving index.html");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// **Signup Route**
app.post("/signup", async (req, res) => {
  console.log("🟢 Signup Request Received:", req.body);

  try {
    const { firstName, lastName, email, phoneNumber, username, password, zipCode } = req.body;

    // ✅ Debug: Validate input
    if (!firstName || !lastName || !email || !username || !password) {
      console.log("❌ Missing required fields:", req.body);
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Debug: Check for existing users
    if (users[username]) {
      console.log("❌ Username already exists:", username);
      return res.status(400).json({ message: "Username already exists" });
    }
    if (Object.values(users).find(user => user.email === email)) {
      console.log("❌ Email already registered:", email);
      return res.status(400).json({ message: "Email already registered" });
    }

    const userID = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    users[username] = { userID, firstName, lastName, email, phoneNumber, zipCode, password: hashedPassword };

    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    console.log("✅ User registered:", username);
    res.status(201).json({ message: "User registered successfully", userID });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// **Login Route**
app.post("/login", async (req, res) => {
  console.log("🟢 Login request received:", req.body);

  try {
    const { username, password, rememberMe } = req.body;
    const user = users[username];

    // ✅ Debug: Check if user exists
    if (!user) {
      console.log("❌ User does not exist:", username);
      return res.status(401).json({ message: "User does not exist" });
    }

    // ✅ Debug: Validate password
    if (!(await bcrypt.compare(password, user.password))) {
      console.log("❌ Incorrect password for:", username);
      return res.status(401).json({ message: "Incorrect password" });
    }

    if (rememberMe) {
      res.cookie("username", username, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
    }

    console.log("✅ Login successful:", username);
    res.status(200).json({ message: "Login successful", userID: user.userID });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// **Logout Route**
app.post("/logout", (req, res) => {
  console.log("🟢 Logout request received");
  res.clearCookie("username");
  res.status(200).json({ message: "Logged out successfully" });
});

// ✅ Start Server
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));