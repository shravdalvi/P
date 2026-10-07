# Vibecheck Backend & Connectivity Guide

## Current Backend Architecture
The **Vibecheck Controller** (Web Application) uses a dual-backend architecture, but relies primarily on **Firebase** for real-time synchronization:

1. **Firebase (Primary Real-Time Engine):**
   - **Authentication:** Firebase Auth is used for logging in admins and security personnel.
   - **Database (Firestore):** The app writes simulated crowd metrics (capacity, net flow, risks, incoming/outgoing) to a `zones` collection.
   - **Synchronization:** The web app constantly listens to changes in the `zones` collection via `onSnapshot` inside `src/lib/firebase.js` and `src/hooks/useBackendSync.js`. This ensures that any external modification (like from a mobile app) is immediately reflected on the live map and dashboard.
   - **Environment Variables:** Configuration is handled via `.env` (e.g., `VITE_FIREBASE_API_KEY`, etc.).

2. **FastAPI (Local/Fallback):**
   - A Python FastAPI WebSocket backend exists (`backend/app/main.py`) for handling events and integrations if Firebase is disabled. However, Firebase is the active real-time data layer when `VITE_USE_FIREBASE=true` is set.

## Achieving Real-time Sync with the Flutter App

To ensure the "Vibecheck" mobile app and the "Vibecheck Controller" web app share the identical state and changes happen in real-time, the mobile app **must connect to the exact same Firebase project**.

### Requirements for Connectivity

1. **Firebase Project Setup:** Both apps must use the exact same Firebase Project configuration found in your `.env` file.
2. **FlutterFire Packages:** The mobile app needs `firebase_core` and `cloud_firestore` installed to communicate with the shared database.
3. **Data Schema Consistency:** The Flutter app must read from and write to the same `zones` collection using the exact fields the web app expects (`id`, `name`, `count`, `capacity`, `risk`, `status`, `netFlow`).

---

## Example: Flutter Connectivity Code

Below is the Dart (Flutter) code required to achieve the exact real-time connection that the website uses.

### 1. Dependencies (`pubspec.yaml`)
```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^2.13.0
  cloud_firestore: ^4.7.1
```

### 2. Initialization and Real-Time Sync (`zones_service.dart`)
This service mirrors what `useBackendSync.js` does on the web, hooking into the live data stream.

```dart
import 'package:cloud_firestore/cloud_firestore.dart';

class ZoneService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Listen to real-time changes from the web controller
  Stream<List<Map<String, dynamic>>> getZonesStream() {
    return _db.collection('zones').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        var data = doc.data();
        data['id'] = doc.id; // Include the document ID
        return data;
      }).toList();
    });
  }

  // Update a zone from the mobile app (will reflect on the website immediately)
  Future<void> updateZone(String zoneId, Map<String, dynamic> updates) async {
    try {
      await _db.collection('zones').doc(zoneId).set(updates, SetOptions(merge: true));
    } catch (e) {
      print("Error updating zone: $e");
    }
  }
}
```

### 3. Using it in a Flutter UI Widget (`live_map_screen.dart`)
This will instantly show any changes triggered by the web app's simulation engine or operators.

```dart
import 'package:flutter/material.dart';
import 'zones_service.dart';

class LiveMapScreen extends StatelessWidget {
  final ZoneService _zoneService = ZoneService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Live Zones')),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: _zoneService.getZonesStream(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Text('Error: ${snapshot.error}');
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }

          final zones = snapshot.data ?? [];

          return ListView.builder(
            itemCount: zones.length,
            itemBuilder: (context, index) {
              final zone = zones[index];
              return ListTile(
                title: Text(zone['name'] ?? 'Unknown Zone'),
                subtitle: Text('Status: ${zone['status']} | Count: ${zone['count']}'),
                trailing: Icon(
                  Icons.circle,
                  color: zone['risk'] == 'critical' ? Colors.red : Colors.green,
                ),
              );
            },
          );
        },
      ),
    );
  }
}
```

By pointing both applications to this shared Firebase Firestore `zones` collection, any crowd redirect, alert, or status change triggered on the web app will instantly stream to the Flutter app via `getZonesStream()`, and any user input from the mobile app via `updateZone()` will be picked up immediately by the web dashboard.
