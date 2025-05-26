// Vercel serverless function for /validate-session
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const { token } = req.query;
  if (!token) return res.status(400).json({ valid: false, message: 'Token missing' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'volunteerhub_jwt_secret');
    res.status(200).json({ valid: true, userID: decoded.userID, username: decoded.username });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
}
