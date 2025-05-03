const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Mock database (replace with a real database like MongoDB or MySQL)
const users = [];
// Default route for the root URL
app.get('/', (req, res) => {
    console.log('Root route accessed');
    res.send('Welcome to the backend server!');
});

// Register endpoint
app.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = users.find(user => user.email === email);
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    users.push({ name, email, password: hashedPassword, role });
    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ email: user.email }, 'secretkey', { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});