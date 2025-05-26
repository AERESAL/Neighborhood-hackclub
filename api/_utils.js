// Shared utilities for Vercel serverless functions
import admin from 'firebase-admin';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

let firebaseApp;
export function getFirestore() {
  if (!firebaseApp) {
    if (!admin.apps.length) {
      let serviceAccount;
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      } else {
        serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'serviceAccountKey.json'), 'utf8'));
      }
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://volunteerhub-9ae56.firebaseio.com'
      });
    } else {
      firebaseApp = admin.app();
    }
  }
  return admin.firestore();
}

export async function getAuthContext(req, res) {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers.cookie) {
    const cookies = parse(req.headers.cookie);
    token = cookies.token;
  }
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return null;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'volunteerhub_jwt_secret');
    return { userID: decoded.userID, username: decoded.username };
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return null;
  }
}

export function getEmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

export async function getEmailTemplate(vars) {
  const templatePath = path.join(process.cwd(), 'email_template.html');
  let emailHtml = fs.readFileSync(templatePath, 'utf8');
  for (const [key, value] of Object.entries(vars)) {
    emailHtml = emailHtml.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return emailHtml;
}
