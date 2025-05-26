// Vercel serverless function for /users (get current user info)
import { getFirestore, getAuthContext } from './_utils';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const db = getFirestore();
  const auth = await getAuthContext(req, res);
  if (!auth) return;
  try {
    const userRef = db.collection('users').doc(auth.username);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({});
    const userData = userDoc.data();
    if (userData && userData.password) delete userData.password;
    // Fetch activities created by this user from userData
    const userDataRef = db.collection('userData').doc(auth.userID);
    const userDataDoc = await userDataRef.get();
    let activities = [];
    if (userDataDoc.exists) {
      const data = userDataDoc.data();
      activities = data.activities || [];
    }
    res.status(200).json({ ...userData, activities });
  } catch (error) {
    res.status(500).json({});
  }
}
