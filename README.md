# Family Inventory & Shopping List App

A full-stack web app using **Next.js**, **Tailwind CSS**, and **Firebase**, deployable on **Vercel**.

## Features

- 🔐 **Authentication**: Firebase Auth (email/password)
- 📦 **Inventory & Shopping List**: Firestore per-user collections
- 🎤 **Voice & Text Input**: React Speech Recognition & text
- 🧠 **Language Understanding**: OpenAI API (via Next.js API route)
- 💅 **Frontend**: Clean dashboard with Tailwind CSS
- 🚀 **Deployment**: One-click deploy to Vercel

## Setup

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd family
   npm install
   ```
2. **Configure Environment**
   - Copy `.env.example` to `.env.local` and fill in your Firebase and OpenAI keys.
3. **Run Locally**
   ```bash
   npm run dev
   ```
4. **Deploy**
   - Push to GitHub and [deploy on Vercel](https://vercel.com/import).

## File Structure

- `src/firebase.ts` — Firebase config
- `src/app/context/authContext.tsx` — Auth state
- `src/app/components/InventoryList.tsx` — Inventory UI
- `src/app/components/ShoppingList.tsx` — Shopping list UI
- `src/app/components/InputBox.tsx` — Text/voice input
- `src/app/api/interpret.ts` — OpenAI intent API

## Environment Variables
See `.env.example` for required variables:
- `NEXT_PUBLIC_FIREBASE_*`
- `OPENAI_API_KEY`

## Notes
- All backend logic is in Next.js API routes (no external server needed)
- App is ready for Vercel deployment
