// Vercel serverless function for root API endpoint
export default function handler(req, res) {
  res.status(200).json({ message: 'VolunteerHub API root. See documentation for available endpoints.' });
}
