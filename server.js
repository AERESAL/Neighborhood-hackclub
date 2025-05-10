const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

// ✅ Fix CORS issue: Allow `localhost` and `127.0.0.1`
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500", "https://volunteerhub-bay.vercel.app"],
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use(cookieParser());

const usersFile = "users.json";

// ✅ Ensure `users.json` exists
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify({}, null, 2));
let users = JSON.parse(fs.readFileSync(usersFile, "utf8"));

// **Sign-up Route**
app.post("/signup", async (req, res) => {
  console.log("Signup Request Received:", req.body);

  try {
    const { firstName, lastName, email, phoneNumber, username, password, zipCode } = req.body;

    if (!firstName || !lastName || !email || !username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (users[username]) return res.status(400).json({ message: "Username already exists" });
    if (Object.values(users).find(user => user.email === email)) return res.status(400).json({ message: "Email already registered" });

    const userID = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    users[username] = { userID, firstName, lastName, email, phoneNumber, zipCode, password: hashedPassword };

    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    res.status(201).json({ message: "User registered successfully", userID });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// **Login Route**
app.post("/login", async (req, res) => {
  console.log("Login request received:", req.body);

  try {
    const { username, password, rememberMe } = req.body;
    const user = users[username];

    if (!user) return res.status(401).json({ message: "User does not exist" });
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Incorrect password" });

    if (rememberMe) {
      res.cookie("username", username, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
    }

    res.status(200).json({ message: "Login successful", userID: user.userID });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// **Logout Route**
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.status(200).json({ message: "Logged out successfully" });
});

// ✅ Start Server
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));