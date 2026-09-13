// -----------------------------------------------------------------------
// Firebase adapter
// -----------------------------------------------------------------------
// This module is the ONLY place that should ever import the Firebase SDK.
// Every other file in the app talks to `crowdEngine.js`, which reads from
// either this adapter (when VITE_USE_FIREBASE=true and credentials are
// present) or the local simulator (default, for demos with no backend).
//
// Swapping in a real deployment later means filling in .env and flipping
// the flag - no component code changes.
// -----------------------------------------------------------------------

const useFirebase = import.meta.env.VITE_USE_FIREBASE === 'true'

let app = null
let auth = null
let db = null
let rtdb = null

export async function initFirebase() {
  if (!useFirebase) return { app: null, auth: null, db: null, rtdb: null }
  if (app) return { app, auth, db, rtdb }

  const { initializeApp } = await import('firebase/app')
  const { getAuth } = await import('firebase/auth')
  const { getFirestore } = await import('firebase/firestore')
  const { getDatabase } = await import('firebase/database')

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  }

  app = initializeApp(config)
  auth = getAuth(app)
  db = getFirestore(app)
  rtdb = getDatabase(app)

  return { app, auth, db, rtdb }
}

export const firebaseEnabled = useFirebase

// Collection names kept centralized so security rules / seed scripts and
// app code never drift apart.
export const COLLECTIONS = {
  users: 'users',
  events: 'events',
  zones: 'zones',
  devices: 'devices',
  gateways: 'gateways',
  crowdReadings: 'crowdReadings',
  crowdAggregates: 'crowdAggregates',
  alerts: 'alerts',
  recommendations: 'recommendations',
  incidents: 'incidents',
  transport: 'transport',
  hospitality: 'hospitality',
  responseTeams: 'responseTeams',
  activityLogs: 'activityLogs'
}
