# AspectEd / AEDA - AI Educational Data Agent

AspectEd is a next-generation "Personal AI Tutor" application designed to help students learn better through document analysis, interactive chat, and personalized feedback. It leverages Google's Gemini 2.5 Flash model for high-performance reasoning and Firebase for real-time data sync.

## 🚀 Features

- **AI Tutor Chat**: Interactive doubt solving powered by Gemini 2.5 Flash.
- **Document Analysis**: Upload PDFs/Images for OCR, summarization, and extracting keywords.
- **Real-time Data Sync**: All interactions and uploads are saved to Firebase Firestore (`aeda_logs`).
- **Student/Teacher Roles**: Toggle between roles to see different views (Teacher uploads, Student learns).
- **Premium UI**: Modern glassmorphism design with responsive animations.

## 🛠️Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4 + Lucide React Icons
- **AI**: Google Generative AI SDK (`@google/generative-ai`)
- **Backend/DB**: Firebase (Firestore)
- **Language**: TypeScript

## ⚡ Getting Started

### 1. Prerequisites

- Node.js 18+ installed.
- Access to a Google AI Studio API Key.
- A Firebase project with Firestore enabled.

### 2. Installation

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory (do NOT commit this file):

```env
# Gemini API Key (Required for AI features)
GOOGLE_API_KEY=your_google_api_key_here

# Firebase Config (Required for Database)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

**Note**: Ask the team lead for the shared development keys if you don't have them.

### 4. Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 📦 Deployment

This project is optimized for deployment on **Vercel**.

1. Push your code to a Git repository (GitHub/GitLab).
2. Connect the repo to Vercel.
3. **CRITICAL**: Add the Environment Variables (from `.env.local`) to the Vercel Project Settings.
4. Deploy!

## 🤝 Contribution Guidelines

- **Main Branch**: `main`
- **Feature Branches**: `feature/feature-name`
- **Commit Messages**: Use semantic commits (e.g., `feat: added upload logic`, `fix: corrected api key bug`).

## 🐞 Known Issues & Fixes

- **Connection Error**: If you see "I'm having trouble connecting to my brain", ensure you are using `gemini-2.5-flash` or a model your API key supports. Check `src/app/actions.ts`.
- **Firestore**: If data isn't saving, check the browser console for permission errors or missing config.

---

Built with ❤️ by the ksp Team.
