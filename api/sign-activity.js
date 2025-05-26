// Vercel serverless function for /sign-activity/:token
import { getFirestore } from './_utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const db = getFirestore();
  const { token } = req.query;
  const { signature } = req.body;
  try {
    const snapshot = await db.collection('activities').get();
    let updated = false;
    for (const doc of snapshot.docs) {
      const activities = doc.data().activities || [];
      const idx = activities.findIndex(a => a.signatureToken === token);
      if (idx !== -1 && !activities[idx].signed) {
        activities[idx].signed = true;
        activities[idx].signatureData = signature;
        await db.collection('activities').doc(doc.id).update({ activities });
        updated = true;
        break;
      }
    }
    if (!updated) return res.status(404).send();
    res.json({ message: 'Signed!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
