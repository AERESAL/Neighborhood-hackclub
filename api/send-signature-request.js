// Vercel serverless function for /send-signature-request endpoint
import { getFirestore, getAuthContext, getEmailTransporter, getEmailTemplate } from './_utils';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const db = getFirestore();
  const auth = await getAuthContext(req, res);
  if (!auth) return;
  const { name, date, start_time, end_time, location, supervisorName, supervisorEmail } = req.body;
  if (!name || !date || !start_time || !end_time || !location || !supervisorName || !supervisorEmail) {
    return res.status(400).json({ message: 'Missing required activity fields' });
  }
  // Generate a unique token for this signature request
  const signatureToken = uuidv4();
  // Store the token and signed:false with the activity in the user's activities
  const activitiesRef = db.collection('activities').doc(auth.username);
  const doc = await activitiesRef.get();
  let activitiesArr = [];
  if (doc.exists) activitiesArr = doc.data().activities || [];
  const idx = activitiesArr.findIndex(
    a => a.name === name && a.date === date && a.start_time === start_time && a.end_time === end_time && a.location === location
  );
  if (idx === -1) return res.status(404).json({ message: 'Activity not found' });
  activitiesArr[idx].signatureToken = signatureToken;
  activitiesArr[idx].signed = false;
  await activitiesRef.set({ activities: activitiesArr }, { merge: true });
  // Get submitter's name and email from user profile
  const userRef = db.collection('users').doc(auth.username);
  const userDoc = await userRef.get();
  let submitterName = auth.username;
  let studentEmail = '';
  if (userDoc.exists) {
    const userData = userDoc.data();
    submitterName = userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : auth.username;
    studentEmail = userData.email || '';
  }
  // Load and fill the email template
  const emailHtml = await getEmailTemplate({
    supervisorName,
    submitterName,
    name,
    date,
    start_time,
    end_time,
    location,
    studentEmail,
    signatureFormUrl: `https://neighborhood-liard.vercel.app/signature-form.html?token=${signatureToken}`
  });
  // Send email
  const transporter = getEmailTransporter();
  await transporter.sendMail({
    from: `VolunteerHub <${process.env.EMAIL_USER}>`,
    to: supervisorEmail,
    subject: `Signature Request for Activity: ${name}`,
    html: emailHtml
  });
  res.status(200).json({ message: 'Signature request email sent to supervisor.' });
}
