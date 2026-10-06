const useFirebase = import.meta.env.VITE_USE_FIREBASE === 'true'

let app = null
let auth = null
let db = null

export const firebaseEnabled = useFirebase

export async function initFirebase() {
  if (!useFirebase) return { app: null, auth: null, db: null }
  if (app) return { app, auth, db }

  const { initializeApp } = await import('firebase/app')
  const { getAuth } = await import('firebase/auth')
  const { getFirestore } = await import('firebase/firestore')

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

  return { app, auth, db }
}

export async function signIn(email, password) {
  if (!useFirebase) throw new Error("Firebase is not enabled.")
  await initFirebase()
  const { signInWithEmailAndPassword } = await import('firebase/auth')
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signOutUser() {
  if (!useFirebase) return
  await initFirebase()
  const { signOut } = await import('firebase/auth')
  return signOut(auth)
}

export async function subscribeAuth(callback) {
  if (!useFirebase) return () => {}
  await initFirebase()
  const { onAuthStateChanged } = await import('firebase/auth')
  return onAuthStateChanged(auth, callback)
}

function hydrateZoneData(id, raw) {
  const zone = { id, ...raw }

  if (typeof raw.geometryJson === 'string') {
    try {
      zone.geometry = JSON.parse(raw.geometryJson)
    } catch (error) {
      console.warn(`[Firebase] Invalid geometryJson for zone ${id}`)
    }
  }

  delete zone.geometryJson

  return zone
}

export async function subscribeZones(callback, onError) {
  if (!useFirebase) return () => {}
  await initFirebase()
  const { collection, onSnapshot } = await import('firebase/firestore')

  const zonesCol = collection(db, 'zones')
  return onSnapshot(
    zonesCol,
    (snapshot) => {
      const zones = []
      snapshot.forEach(doc => {
        zones.push(hydrateZoneData(doc.id, doc.data()))
      })
      callback(zones)
    },
    (err) => {
      if (onError) onError(err)
    }
  )
}

function extractZoneData(zone, serverTimestampFn) {
  const data = {}

  const fields = [
    'id',
    'name',
    'capacity',
    'count',
    'ratio',
    'occupancy',
    'occupancyPercentage',
    'incoming',
    'outgoing',
    'netFlow',
    'risk',
    'status',
    'prediction',
    'lng',
    'lat',
    'neighbors'
  ]

  for (const field of fields) {
    if (zone[field] !== undefined) {
      data[field] = zone[field]
    }
  }

  if (zone.geometry !== undefined) {
    data.geometryJson = JSON.stringify(zone.geometry)
  }

  if (serverTimestampFn) {
    data.updatedAt = serverTimestampFn()
  }

  return data
}

export async function writeZones(zones) {
  if (!useFirebase) return
  await initFirebase()
  const { writeBatch, doc, serverTimestamp } = await import('firebase/firestore')

  const batch = writeBatch(db)
  for (const z of zones) {
    const zoneRef = doc(db, 'zones', z.id)
    batch.set(zoneRef, extractZoneData(z, serverTimestamp), { merge: true })
  }
  await batch.commit()
}

export async function seedInitialZones(zones) {
  if (!useFirebase) return
  await initFirebase()
  const { writeBatch, doc, serverTimestamp } = await import('firebase/firestore')

  const batch = writeBatch(db)
  for (const z of zones) {
    const zoneRef = doc(db, 'zones', z.id)
    batch.set(zoneRef, extractZoneData(z, serverTimestamp))
  }
  await batch.commit()
}
