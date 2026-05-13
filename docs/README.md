# 📚 HouseGram Web Documentation

<div align="center">

![Documentation](https://img.shields.io/badge/Documentation-Complete-10b981?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-2.2.0--beta-6366f1?style=for-the-badge)
![Last Updated](https://img.shields.io/badge/Updated-April_2024-ec4899?style=for-the-badge)

**Complete guide to building, customizing, and deploying your own HouseGram messenger**

</div>

---

## 📖 Table of Contents

### 🚀 Getting Started
1. [Installation Guide](./installation.md) - Set up your development environment
2. [Firebase Setup](./firebase-setup.md) - Configure Firebase backend
3. [Environment Variables](./environment.md) - Configure your app
4. [Quick Start Tutorial](./quick-start.md) - Build your first feature

### 🏗️ Architecture
5. [Project Structure](./structure.md) - Understand the codebase
6. [State Management](./state.md) - How data flows in the app
7. [API Reference](./api.md) - Available functions and hooks
8. [Database Schema](./database-schema.md) - Firebase collections structure

### 🎨 Customization
9. [Theming Guide](./theming.md) - Customize colors and styles
10. [Adding Features](./features.md) - Build new features
11. [Custom Components](./components.md) - Create reusable components
12. [Styling Guide](./styling.md) - Tailwind CSS best practices

### 🎮 Features Deep Dive
13. [Mini-Games System](./mini-games.md) - Build and integrate games
14. [Gifts System](./gifts.md) - Implement gift sending
15. [Premium Features](./premium.md) - Add subscription features
16. [Channels & Groups](./channels.md) - Create broadcast channels

### 🔐 Security
17. [Authentication](./authentication.md) - User auth implementation
18. [Security Rules](./security-rules.md) - Firebase security
19. [Data Privacy](./privacy.md) - GDPR compliance
20. [Best Practices](./security-best-practices.md) - Security guidelines

### 🚀 Deployment
21. [Deployment Guide](./deployment.md) - Deploy to production
22. [Vercel Setup](./vercel-setup.md) - Deploy on Vercel
23. [Custom Domain](./custom-domain.md) - Set up your domain
24. [Performance Optimization](./performance.md) - Speed up your app

### 🐛 Troubleshooting
25. [Common Issues](./troubleshooting.md) - Fix common problems
26. [FAQ](./faq.md) - Frequently asked questions
27. [Error Codes](./errors.md) - Error reference
28. [Support](./support.md) - Get help

---

## 🎯 Quick Links

<table>
<tr>
<td width="50%">

### 👨‍💻 For Developers
- [Installation Guide](./installation.md)
- [Project Structure](./structure.md)
- [API Reference](./api.md)
- [Contributing Guide](../CONTRIBUTING.md)

</td>
<td width="50%">

### 🎨 For Designers
- [Theming Guide](./theming.md)
- [Styling Guide](./styling.md)
- [Component Library](./components.md)
- [Design System](./design-system.md)

</td>
</tr>
<tr>
<td width="50%">

### 🚀 For Deployers
- [Deployment Guide](./deployment.md)
- [Vercel Setup](./vercel-setup.md)
- [Environment Setup](./environment.md)
- [Performance Tips](./performance.md)

</td>
<td width="50%">

### 🔐 For Security
- [Authentication](./authentication.md)
- [Security Rules](./security-rules.md)
- [Best Practices](./security-best-practices.md)
- [Privacy Guide](./privacy.md)

</td>
</tr>
</table>

---

## 📚 Documentation Sections

### 1. 🚀 Getting Started

Learn how to set up HouseGram Web from scratch. This section covers everything from installing dependencies to running your first development server.

**Topics:**
- Prerequisites and system requirements
- Installing Node.js and npm
- Cloning the repository
- Setting up Firebase
- Configuring environment variables
- Running the development server

### 2. 🏗️ Architecture

Understand the technical architecture of HouseGram Web. Learn about the project structure, state management, and how different parts of the application work together.

**Topics:**
- Folder structure and organization
- Component hierarchy
- State management with React Context
- Firebase integration
- Real-time data synchronization
- API design patterns

### 3. 🎨 Customization

Make HouseGram Web your own! This section teaches you how to customize the look and feel, add new features, and extend functionality.

**Topics:**
- Changing theme colors
- Adding custom wallpapers
- Creating new views
- Building custom components
- Styling with Tailwind CSS
- Animation with Framer Motion

### 4. 🎮 Features Deep Dive

Detailed guides on implementing and customizing major features like mini-games, gifts, premium subscriptions, and more.

**Topics:**
- Building mini-games
- Implementing gift system
- Adding premium features
- Creating channels
- Voice messages
- File uploads

### 5. 🔐 Security

Learn how to keep your HouseGram instance secure. This section covers authentication, authorization, data privacy, and security best practices.

**Topics:**
- Google Authentication setup
- Firebase Security Rules
- Data encryption
- User privacy
- GDPR compliance
- Security auditing

### 6. 🚀 Deployment

Deploy your HouseGram Web instance to production. Learn about different hosting options, performance optimization, and monitoring.

**Topics:**
- Deploying to Vercel
- Custom domain setup
- Environment configuration
- Performance optimization
- Monitoring and analytics
- Backup strategies

### 7. 🐛 Troubleshooting

Find solutions to common problems and learn how to debug issues in your HouseGram instance.

**Topics:**
- Common errors and fixes
- Debugging techniques
- Performance issues
- Firebase connection problems
- Build errors
- Runtime errors

---

## 🎓 Tutorials

### Beginner Tutorials
1. [Your First HouseGram Setup](./tutorials/first-setup.md)
2. [Customizing Theme Colors](./tutorials/custom-theme.md)
3. [Adding a New View](./tutorials/new-view.md)
4. [Creating Custom Components](./tutorials/custom-component.md)

### Intermediate Tutorials
5. [Building a Mini-Game](./tutorials/build-game.md)
6. [Implementing Real-time Features](./tutorials/realtime-features.md)
7. [Adding Payment Integration](./tutorials/payment-integration.md)
8. [Creating Admin Panel](./tutorials/admin-panel.md)

### Advanced Tutorials
9. [Custom Authentication Provider](./tutorials/custom-auth.md)
10. [Building a Bot API](./tutorials/bot-api.md)
11. [Implementing E2E Encryption](./tutorials/e2e-encryption.md)
12. [Scaling to 1M Users](./tutorials/scaling.md)

---

## 📖 API Documentation

### Core APIs
- [ChatContext API](./api/chat-context.md) - Global state management
- [Firebase API](./api/firebase.md) - Database operations
- [Storage API](./api/storage.md) - File uploads
- [Auth API](./api/auth.md) - Authentication

### Feature APIs
- [Gifts API](./api/gifts.md) - Gift system
- [Premium API](./api/premium.md) - Premium features
- [Games API](./api/games.md) - Mini-games
- [Channels API](./api/channels.md) - Channel management

---

## 🔧 Configuration Reference

### Environment Variables
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google AI (Optional)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
```

### Firebase Collections
- `users` - User profiles and settings
- `chats` - Chat metadata
- `chats/{chatId}/messages` - Chat messages
- `channels` - Channel information
- `gifts_sent` - Gift transactions
- `users/{userId}/received_gifts` - User's received gifts

---

## 🎨 Design System

### Colors
```javascript
// Primary Colors
primary: '#6366f1'    // Indigo
secondary: '#ec4899'  // Pink
success: '#10b981'    // Green
warning: '#f59e0b'    // Amber
error: '#ef4444'      // Red

// Theme Colors
telegram-blue: '#0088cc'
dark-bg: '#0f172a'
light-bg: '#ffffff'
```

### Typography
- **Headings**: System font stack
- **Body**: -apple-system, BlinkMacSystemFont, "Segoe UI"
- **Code**: "Fira Code", monospace

### Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

---

## 🤝 Contributing to Documentation

Found an error or want to improve the docs? We welcome contributions!

### How to Contribute
1. Fork the repository
2. Edit documentation files in `/docs`
3. Submit a pull request
4. Wait for review

### Documentation Style Guide
- Use clear, concise language
- Include code examples
- Add screenshots when helpful
- Keep sections organized
- Update table of contents

---

## 📞 Need Help?

Can't find what you're looking for? We're here to help!

- 💬 **Telegram Bot**: [@HouseGramBot](https://t.me/HouseGramBot) - Официальная поддержка

---

<div align="center">

**Made with 💜 by the HouseGram Team**

[Back to Main README](../README.md) | [View on GitHub](https://github.com/HouseGram-code/HouseGram-Web)

</div>
