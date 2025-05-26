// Vercel serverless function for /login
import { getFirestore } from './_utils';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const db = getFirestore();
  try {
    const { username, password } = req.body;
    let user;
    const userRef = db.collection('users').doc(username);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      user = userDoc.data();
    }
    if (!user) return res.status(401).json({ message: 'User does not exist' });
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Incorrect password' });
    const token = jwt.sign({ userID: user.userID, username }, process.env.JWT_SECRET || 'volunteerhub_jwt_secret', { expiresIn: '7d' });
    res.status(200).json({ message: 'Login successful', userID: user.userID, username, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
