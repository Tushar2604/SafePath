# 🛡️ SafePath – One-Tap Emergency Response App

SafePath is a React Native mobile application designed for rapid emergency response. With a single tap, users can alert emergency contacts with their real-time location, share their situation, and receive smart assistance powered by AI. It leverages Firebase, Google Maps, and Gemini AI to ensure both speed and intelligence in critical moments.

---

## 🚀 Tech Stack

### 📱 Frontend
- **React Native** with **TypeScript** – Cross-platform mobile app development.
- **Expo** – Simplified development and deployment.
- **React Navigation** – Seamless screen transitions.
- **Google Maps SDK** – Location visualization and tracking.

### ☁️ Backend / Services
- **Firebase**:
  - Authentication (Phone/Email OTP)
  - Firestore (Realtime database for user/emergency data)
  - Cloud Messaging (Push notifications)
  - Firebase Functions (optional automation)
- **Gemini AI** (Google AI Studio) – Smart situation analysis and summarization.

---

## 🏗️ Architecture & Explanation

### High-Level Architecture

```

                     ┌────────────────────────────┐
                     │    React Native App        │
                     │  (TypeScript + Expo)       │
                     └────────────┬───────────────┘
                                  │
                     ┌────────────▼─────────────┐
                     │    Firebase Auth         │◄──────────────┐
                     │  (Phone/Email Login)     │               │
                     └────────────┬─────────────┘               │
                                  │                             │
             ┌────────────────────▼──────────────┐              │
             │      Firestore Database           │              │
             │ (Stores SOS alerts & contacts)    │              │
             └────────────────────┬──────────────┘              │
                                  │                             │
      ┌───────────────────────────▼────────────────────────┐    │
      │            Firebase Cloud Messaging                │    │
      │ (Sends push alerts to registered contacts/devices) │    │
      └───────────────────────────┬────────────────────────┘    │
                                  │                             │
                        ┌─────────▼──────────┐                  │
                        │ Google Maps SDK    │◄──────┐          │
                        │ (Live location)    │       │          │
                        └─────────┬──────────┘       │          │
                                  │                  │          │
                         ┌────────▼─────────┐        │          │
                         │ Geolocation API  │────────┘          │
                         └──────────────────┘                   │
                                                                │
                         ┌────────────────────┐                 │
                         │ Gemini AI (API)    │◄────────────────┘
                         │ Smart summaries &  │
                         │ emergency insights │
                         └────────────────────┘

````

### Key Features Breakdown

| Feature | Tech Used | Description |
|--------|-----------|-------------|
| One-Tap SOS | React Native, Firestore | Triggers SOS, stores alert in DB |
| Realtime Location | Google Maps, Geolocation API | Continuously updates and shares user location |
| Emergency Contacts | Firestore | Stores and notifies registered contacts |
| Push Alerts | Firebase Cloud Messaging | Notifies emergency contacts instantly |
| Smart Summary | Gemini AI | Generates a summary of the situation for responders |
| Auth | Firebase Auth | Secure login with phone/email verification |

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Tushar2604/SafePath.git
cd SafePath
````

### 2. Install Dependencies

Ensure you have Node.js, Expo CLI, and npm/yarn installed.

```bash
npm install
# or
yarn install
```

### 3. Configure Firebase

* Go to [Firebase Console](https://console.firebase.google.com/)
* Create a project: **SafePath**
* Add Android/iOS app and download the `google-services.json` or `GoogleService-Info.plist`
* Enable:

  * Firestore Database
  * Firebase Authentication (Phone/Email)
  * Firebase Cloud Messaging

#### Add Firebase Config

Create a file at `src/config/firebase.ts`:

```ts
// src/config/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
```

> **Note**: Replace values with those from your Firebase dashboard.

### 4. Get Google Maps API Key

* Go to [Google Cloud Console](https://console.cloud.google.com/)
* Enable:

  * Maps SDK for Android/iOS
  * Places API (if needed)
* Create API Key
* Add the key to your environment or config file.

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 5. Start the App

```bash
npx expo start
```

Use an emulator or scan the QR with your Expo Go app.

---

## 📦 Folder Structure

```
SafePath/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # App screens (Home, Login, SOS)
│   ├── config/           # Firebase and API configs
│   ├── services/         # Firebase & AI service wrappers
│   └── utils/            # Helper functions and constants
├── assets/               # Icons, images
├── App.tsx               # Root app component
├── app.json              # Expo config
└── package.json
```

---

## 🧠 AI Integration – Gemini (Google AI Studio)

* Gemini is used to analyze SOS messages or user input and provide a quick summary or recommended steps.
* Integration is done via REST API using access tokens.
* Can be extended to handle voice-to-text and sentiment analysis.

---

## 📌 Future Enhancements

* 🧭 Live direction to nearest safe zone or police station
* 🎙️ Voice-activated emergency
* 🧠 Real-time AI chat for guidance
* 🌐 Offline fallback via SMS

---

## 👩‍💻 Contributors

* [Tushar2604](https://github.com/Tushar2604)
* [Muskan244](https://github.com/Muskan244)
