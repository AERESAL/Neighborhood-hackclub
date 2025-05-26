// Vercel serverless function for /logout
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  res.setHeader('Set-Cookie', 'username=; Max-Age=0; Path=/; HttpOnly');
  res.status(200).json({ message: 'Logged out successfully' });
}
