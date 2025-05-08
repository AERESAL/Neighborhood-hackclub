const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = "users.json";
const USER_DATA_FILE = "userData.json";
const SALT_ROUNDS = 10;

// **Get all users (hashed passwords)**
app.get("/users", (req, res) => {
  fs.readFile(USERS_FILE, "utf-8", (err, data) => {
    if (err) return res.status(500).json({ error: "Error reading user file" });
    res.json(JSON.parse(data));
  });
});

// **Get specific user data by ID**
app.get("/userData/:id", (req, res) => {
  fs.readFile(USER_DATA_FILE, "utf-8", (err, data) => {
    if (err) return res.status(500).json({ error: "Error reading user data file" });

    const userData = JSON.parse(data);
    const userId = req.params.id;
    
    if (!userData[userId]) return res.status(404).json({ error: "User not found" });

    res.json(userData[userId]);
  });
});

// **Register a new user (hash password & update JSON)**
app.post("/register", async (req, res) => {
  const { username, password, name } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  fs.readFile(USERS_FILE, "utf-8", async (err, data) => {
    if (err) return res.status(500).json({ error: "Error reading user file" });

    const users = JSON.parse(data);
    const existingUser = users.find(user => user.username === username);

    if (existingUser) return res.status(400).json({ error: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = { id: users.length + 1, username, hashedPassword, name };

    users.push(newUser);
    fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Error saving user data" });
      res.json({ message: "User registered successfully!", user: newUser });
    });
  });
});

// **Login user (verify hashed password)**
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  fs.readFile(USERS_FILE, "utf-8", async (err, data) => {
    if (err) return res.status(500).json({ error: "Error reading user file" });

    const users = JSON.parse(data);
    const user = users.find(user => user.username === username);

    if (!user) return res.status(404).json({ error: "User not found" });

    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    
    if (passwordMatch) {
      res.json({ message: "Login successful!", userId: user.id, name: user.name });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });
});

// **Update user data (modify activities, preferences, etc.)**
app.post("/updateUserData/:id", (req, res) => {
  const userId = req.params.id;
  const newUserData = req.body;

  fs.readFile(USER_DATA_FILE, "utf-8", (err, data) => {
    if (err) return res.status(500).json({ error: "Error reading user data file" });

    const userData = JSON.parse(data);
    
    if (!userData[userId]) return res.status(404).json({ error: "User not found" });

    userData[userId] = { ...userData[userId], ...newUserData };

    fs.writeFile(USER_DATA_FILE, JSON.stringify(userData, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Error updating user data" });
      res.json({ message: "User data updated successfully!", userData: userData[userId] });
    });
  });
});

// **Start the server**
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));