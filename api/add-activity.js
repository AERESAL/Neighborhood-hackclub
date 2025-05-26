// Vercel serverless function for /add-activity (userData collection)
import { getFirestore, getAuthContext } from './_utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const db = getFirestore();
  const auth = await getAuthContext(req, res);
  if (!auth) return;
  try {
    const { title, place, activityDate, startTime, endTime, supervisorName, supervisorEmail } = req.body;
    const userDataRef = db.collection('userData').doc(auth.userID);
    const userDataDoc = await userDataRef.get();
    if (!userDataDoc.exists) return res.status(404).json({ message: 'User data not found' });
    const userData = userDataDoc.data();
    const newActivity = { title, place, activityDate, startTime, endTime, supervisorName, supervisorEmail };
    const updatedActivities = userData.activities ? [...userData.activities, newActivity] : [newActivity];
    await userDataRef.update({ activities: updatedActivities });
    res.status(201).json({ message: 'Activity added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
