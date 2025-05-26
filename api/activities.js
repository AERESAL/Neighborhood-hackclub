// Vercel serverless function for /activities endpoints
import { getFirestore, getAuthContext } from './_utils';

export default async function handler(req, res) {
  const db = getFirestore();
  const { method, query, body, headers } = req;
  const auth = await getAuthContext(req, res);
  if (!auth) return; // getAuthContext handles error response

  if (method === 'POST') {
    // Add activity for authenticated user
    const { name, date, start_time, end_time, location, supervisorName, supervisorEmail } = body;
    if (!name || !date || !start_time || !end_time || !location || !supervisorName || !supervisorEmail) {
      return res.status(400).json({ message: 'Missing required activity fields' });
    }
    const activitiesRef = db.collection('activities').doc(auth.username);
    const doc = await activitiesRef.get();
    let activitiesArr = [];
    if (doc.exists) activitiesArr = doc.data().activities || [];
    const newActivity = { name, date, start_time, end_time, location, supervisorName, supervisorEmail };
    activitiesArr.push(newActivity);
    await activitiesRef.set({ activities: activitiesArr }, { merge: true });
    return res.status(201).json({ message: 'Activity added successfully' });
  }

  if (method === 'GET') {
    // Get activities for authenticated user
    const username = query.username || auth.username;
    const doc = await db.collection('activities').doc(username).get();
    if (!doc.exists) return res.status(200).json({ activities: [] });
    const data = doc.data();
    return res.status(200).json({ activities: data.activities || [] });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
