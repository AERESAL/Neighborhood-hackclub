// Vercel serverless function for /get-activities (userData collection)
import { getFirestore, getAuthContext } from './_utils';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const db = getFirestore();
  const auth = await getAuthContext(req, res);
  if (!auth) return;
  try {
    const userDataRef = db.collection('userData').doc(auth.userID);
    const userDataDoc = await userDataRef.get();
    if (!userDataDoc.exists) return res.status(404).json({ activities: [] });
    const userData = userDataDoc.data();
    res.status(200).json({ activities: userData.activities || [] });
  } catch (error) {
    res.status(500).json({ activities: [] });
  }
}
