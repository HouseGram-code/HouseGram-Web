# 🚀 Installation Guide

Complete guide to installing and setting up HouseGram Web on your local machine.

---

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

### Required Software

| Software | Minimum Version | Download Link |
|----------|----------------|---------------|
| **Node.js** | v18.0.0+ | [nodejs.org](https://nodejs.org/) |
| **npm** | v9.0.0+ | Included with Node.js |
| **Git** | v2.30.0+ | [git-scm.com](https://git-scm.com/) |

### Accounts Needed

- **Firebase Account** - [console.firebase.google.com](https://console.firebase.google.com/)
- **Google Account** - For Firebase authentication
- **GitHub Account** - To clone the repository

---

## 📥 Step 1: Clone the Repository

Open your terminal and run:

```bash
# Clone via HTTPS
git clone https://github.com/HouseGram-code/HouseGram-Web.git

# Or clone via SSH (if you have SSH keys set up)
git clone git@github.com:HouseGram-code/HouseGram-Web.git

# Navigate to the project directory
cd HouseGram-Web
```

---

## 📦 Step 2: Install Dependencies

Install all required npm packages:

```bash
# Using npm
npm install

# Or using yarn
yarn install

# Or using pnpm
pnpm install
```

This will install:
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Firebase SDK
- Framer Motion
- And all other dependencies

---

## 🔥 Step 3: Set Up Firebase

### 3.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "housegram-web")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 3.2 Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Google** sign-in method
4. Add your domain to authorized domains

### 3.3 Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in production mode"
4. Select your region
5. Click "Enable"

### 3.4 Set Up Storage

1. Go to **Storage**
2. Click "Get started"
3. Use default security rules
4. Click "Done"

### 3.5 Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click the web icon `</>`
4. Register your app
5. Copy the configuration object

---

## ⚙️ Step 4: Configure Environment Variables

### 4.1 Create Environment File

```bash
# Copy the example file
cp .env.example .env.local
```

### 4.2 Add Firebase Credentials

Open `.env.local` and add your Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Optional: Google AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Admin Email
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
```

---

## 🏃 Step 5: Run Development Server

Start the development server:

```bash
npm run dev
```

The app will be available at:
- **Local**: http://localhost:3000
- **Network**: http://192.168.x.x:3000

---

## ✅ Step 6: Verify Installation

### Check if everything works:

1. **Open browser** - Navigate to http://localhost:3000
2. **Sign in** - Click "Sign in with Google"
3. **Test messaging** - Try sending a message
4. **Check features** - Explore different sections

### Common Issues:

#### Port 3000 is already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

#### Firebase connection error
- Check your `.env.local` file
- Verify Firebase credentials
- Check internet connection

#### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

---

## 🔧 Optional: Additional Setup

### Enable Google AI Features

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env.local`:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
```

### Set Up Admin Account

1. Sign in with your Google account
2. Add your email to `.env.local`:
```env
NEXT_PUBLIC_ADMIN_EMAIL=your-email@gmail.com
```
3. Restart the dev server

---

## 📱 Next Steps

Now that you have HouseGram Web running:

1. [Configure Firebase Security Rules](./firebase-setup.md)
2. [Customize Theme Colors](./theming.md)
3. [Add New Features](./features.md)
4. [Deploy to Production](./deployment.md)

---

## 🆘 Need Help?

- 💬 [Telegram Bot Support](https://t.me/HouseGramBot) - Официальная поддержка HouseGram

---

[← Back to Documentation](./README.md) | [Next: Firebase Setup →](./firebase-setup.md)
