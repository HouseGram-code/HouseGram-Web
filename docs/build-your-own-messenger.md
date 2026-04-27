# 🛠️ Build Your Own Messenger

Complete guide to creating your own custom messenger based on HouseGram Web.

---

## 🎯 Overview

This guide will teach you how to:
- Clone and customize HouseGram Web
- Add your own branding
- Implement custom features
- Deploy your messenger
- Manage users and content

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Branding & Customization](#branding--customization)
3. [Adding Features](#adding-features)
4. [Security & Privacy](#security--privacy)
5. [Deployment](#deployment)
6. [Maintenance](#maintenance)

---

## 🚀 Getting Started

### Step 1: Fork the Repository

1. Go to [HouseGram Web GitHub](https://github.com/HouseGram-code/HouseGram-Web)
2. Click "Fork" button
3. Clone your fork:
```bash
git clone https://github.com/YOUR-USERNAME/HouseGram-Web.git
cd HouseGram-Web
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Firebase

Follow the [Firebase Setup Guide](./firebase-setup.md) to:
- Create your Firebase project
- Enable Authentication
- Set up Firestore
- Configure Storage

---

## 🎨 Branding & Customization

### Change App Name

#### 1. Update package.json
```json
{
  "name": "your-messenger-name",
  "version": "1.0.0",
  "description": "Your custom messenger"
}
```

#### 2. Update Title & Metadata

**File**: `app/layout.tsx`
```typescript
export const metadata: Metadata = {
  title: 'Your Messenger Name',
  description: 'Your messenger description',
  // ... other metadata
}
```

#### 3. Update Side Menu

**File**: `components/SideMenu.tsx`
```typescript
<div className="font-semibold">Your Messenger Name</div>
<div className="text-[10px]">v1.0 • Your Tagline</div>
```

### Change Theme Colors

#### 1. Update Default Theme

**File**: `context/ChatContext.tsx`
```typescript
const [themeColor, setThemeColor] = useState('#YOUR_COLOR');
```

#### 2. Update Tailwind Config

**File**: `tailwind.config.ts`
```typescript
theme: {
  extend: {
    colors: {
      'primary': '#YOUR_PRIMARY_COLOR',
      'secondary': '#YOUR_SECONDARY_COLOR',
      // ... more colors
    }
  }
}
```

### Add Your Logo

#### 1. Create Logo Files

Place your logo files in `public/`:
- `logo.png` - Main logo
- `logo-icon.png` - Icon only
- `favicon.ico` - Browser favicon

#### 2. Update Icon Components

**File**: `app/icon.tsx`
```typescript
export default function Icon() {
  return (
    <img src="/logo-icon.png" alt="Logo" />
  )
}
```

### Customize Wallpapers

Add custom wallpapers to `public/wallpapers/`:
```
public/
  wallpapers/
    wallpaper-1.jpg
    wallpaper-2.jpg
    wallpaper-3.jpg
```

Update wallpaper list in `context/ChatContext.tsx`.

---

## ✨ Adding Features

### Add a New View

#### 1. Create Component

**File**: `components/MyNewView.tsx`
```typescript
'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export default function MyNewView() {
  const { setView, themeColor } = useChat();

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="absolute inset-0 bg-white flex flex-col z-10"
    >
      {/* Header */}
      <div
        className="px-4 h-14 flex items-center gap-3"
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => setView('menu')}>
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-white text-lg font-semibold">
          My New Feature
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <p>Your feature content here</p>
      </div>
    </motion.div>
  );
}
```

#### 2. Add to View Types

**File**: `types/index.ts`
```typescript
export type ViewState = 
  | 'menu' 
  | 'chat' 
  | 'my-new-view'  // Add your view
  | ...
```

#### 3. Register Component

**File**: `app/page.tsx`
```typescript
const MyNewView = dynamic(() => import('@/components/MyNewView'));

const viewComponents: Record<string, React.ComponentType> = {
  // ... existing views
  'my-new-view': MyNewView,
};
```

#### 4. Add Menu Item

**File**: `components/SideMenu.tsx`
```typescript
<MenuItem 
  icon={<YourIcon size={22} />} 
  text="My New Feature" 
  onClick={() => { 
    setView('my-new-view'); 
    setSideMenuOpen(false); 
  }}
/>
```

### Add Custom Mini-Game

#### 1. Create Game Component

**File**: `components/games/MyGame.tsx`
```typescript
export default function MyGame({ onBack }: { onBack: () => void }) {
  const [score, setScore] = useState(0);

  return (
    <div className="game-container">
      <h1>My Custom Game</h1>
      <p>Score: {score}</p>
      {/* Game logic here */}
    </div>
  );
}
```

#### 2. Add to Mini-Games View

**File**: `components/MiniGamesView.tsx`
```typescript
const games = [
  // ... existing games
  {
    id: 'my-game',
    name: 'My Game',
    icon: <GameIcon />,
    description: 'Play my custom game!',
    available: true
  }
];
```

### Add Custom Gift

#### 1. Update Gifts List

**File**: `components/SendGiftView.tsx`
```typescript
const GIFTS = [
  // ... existing gifts
  {
    id: 'my_gift',
    name: 'My Custom Gift',
    emoji: '🎁',
    animatedUrl: 'https://your-cdn.com/gift.webp',
    cost: 50,
    animation: 'bounce',
    available: true,
    animated: true
  }
];
```

---

## 🔐 Security & Privacy

### Set Up Security Rules

#### 1. Firestore Rules

**File**: `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Chat messages
    match /chats/{chatId}/messages/{messageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

#### 2. Storage Rules

**File**: `storage.rules`
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Enable Admin Features

#### 1. Set Admin Email

**File**: `.env.local`
```env
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com
```

#### 2. Create Admin Panel

See [Admin Panel Tutorial](./tutorials/admin-panel.md)

---

## 🚀 Deployment

### Deploy to Vercel

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login to Vercel
```bash
vercel login
```

#### 3. Deploy
```bash
vercel deploy --prod
```

#### 4. Set Environment Variables

In Vercel Dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add all variables from `.env.local`

### Custom Domain

#### 1. Add Domain in Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records

#### 2. Update Firebase
1. Add domain to Firebase authorized domains
2. Update OAuth redirect URIs

---

## 🔧 Maintenance

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update specific package
npm install package-name@latest
```

### Monitor Performance

#### 1. Set Up Analytics

**File**: `app/layout.tsx`
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### 2. Monitor Firebase Usage

- Check Firebase Console regularly
- Set up billing alerts
- Monitor Firestore reads/writes

### Backup Data

#### 1. Export Firestore Data
```bash
gcloud firestore export gs://your-bucket/backups
```

#### 2. Backup Storage Files
Use Firebase Storage backup tools

---

## 📊 User Management

### Add User Roles

#### 1. Create Roles System

**File**: `lib/roles.ts`
```typescript
export type UserRole = 'user' | 'moderator' | 'admin';

export function hasPermission(role: UserRole, action: string): boolean {
  const permissions = {
    user: ['read', 'write'],
    moderator: ['read', 'write', 'delete'],
    admin: ['read', 'write', 'delete', 'manage']
  };
  
  return permissions[role]?.includes(action) || false;
}
```

#### 2. Update User Profile

**File**: `types/index.ts`
```typescript
export interface UserProfile {
  // ... existing fields
  role?: UserRole;
}
```

### Moderate Content

#### 1. Add Report System

Create a report button in messages:
```typescript
<button onClick={() => reportMessage(messageId)}>
  Report
</button>
```

#### 2. Create Moderation Panel

See [Moderation Guide](./moderation.md)

---

## 🎓 Advanced Topics

### Add Payment Integration

See [Payment Integration Tutorial](./tutorials/payment-integration.md)

### Implement E2E Encryption

See [E2E Encryption Guide](./tutorials/e2e-encryption.md)

### Build Mobile Apps

See [Mobile Development Guide](./mobile-development.md)

### Scale to 1M Users

See [Scaling Guide](./tutorials/scaling.md)

---

## 📚 Resources

### Documentation
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community
- [HouseGram Telegram Bot](https://t.me/HouseGramBot) - Официальная поддержка

### Tools
- [Firebase Console](https://console.firebase.google.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [VS Code](https://code.visualstudio.com/)

---

## 🆘 Need Help?

- � [Telegram Bot Support](https://t.me/HouseGramBot) - Официальная поддержка HouseGram

---

<div align="center">

**Good luck building your messenger! 🚀**

[← Back to Documentation](./README.md)

</div>
