// Vercel serverless function for /activity-by-token/:token
import { getFirestore } from './_utils';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const db = getFirestore();
  const { token } = req.query;
  try {
    const snapshot = await db.collection('activities').get();
    let found = null;
    snapshot.forEach(doc => {
      const activities = doc.data().activities || [];
      const match = activities.find(a => a.signatureToken === token);
      if (match) found = { ...match, username: doc.id };
    });
    if (!found || found.signed) return res.status(404).send();
    res.json(found);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
