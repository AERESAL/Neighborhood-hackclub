// Vercel serverless function for /signup
import { getFirestore } from './_utils';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const db = getFirestore();
  try {
    const { firstName, lastName, email, phoneNumber, username, password, zipCode } = req.body;
    if (!firstName || !lastName || !email || !username || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const safePhoneNumber = typeof phoneNumber === 'undefined' ? '' : phoneNumber;
    // Check if username exists
    const userRef = db.collection('users').doc(username);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    // Check if email exists
    const emailQuery = await db.collection('users').where('email', '==', email).get();
    if (!emailQuery.empty) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userID = uuidv4();
    // Create user object
    const newUser = {
      userID,
      firstName,
      lastName,
      email,
      phoneNumber: safePhoneNumber,
      zipCode,
      password: hashedPassword
    };
    await db.collection('users').doc(username).set(newUser);
    // Add to 'userData' collection
    const userData = {
      name: `${firstName} ${lastName}`,
      email,
      preferences: {},
      activities: []
    };
    await db.collection('userData').doc(userID).set(userData);
    res.status(201).json({ message: 'User registered successfully', userID });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
