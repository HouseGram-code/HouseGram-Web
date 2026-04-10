<div align="center">

# 🔥 HouseGram 🔥

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&duration=2800&pause=2000&color=FF0000&center=true&vCenter=true&width=940&lines=Modern+Telegram-Style+Messenger;Real-time+Chat+%26+Channels;Firebase+%2B+Supabase+Powered" alt="Typing SVG" />

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-red?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-black?style=for-the-badge&logo=firebase&logoColor=red)](https://firebase.google.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-red?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-black?style=for-the-badge)](LICENSE)

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="700">

### 🌐 [English](#english) | [Русский](#russian)

</div>

---

<a name="english"></a>

## 🚀 English Version

### ⚡ About The Project

**HouseGram** is a modern, feature-rich messenger inspired by Telegram's sleek design. Built with cutting-edge technologies, it offers real-time messaging, channels, file sharing, and a unique gift system powered by "Lightning" currency.

<div align="center">

### ✨ Key Features

</div>

```diff
+ 💬 Real-time Messaging        - Instant message delivery with Firebase
+ 📢 Channels & Broadcasting    - Create and manage public channels
+ 🎁 Gift System                - Send gifts using Lightning currency
+ 📁 File Sharing               - Images, videos, audio, documents
+ 🎨 Customizable Themes        - Multiple color schemes & wallpapers
+ 🔒 Security & Privacy         - End-to-end encryption ready
+ 📱 PWA Support                - Install as mobile app
+ 🌙 Dark Mode                  - Eye-friendly interface
+ ⚡ Lightning Fast             - Optimized performance
+ 🔔 Push Notifications         - Stay updated with FCM
```

---

### 🛠️ Tech Stack

<div align="center">

| Frontend | Backend | Database | Storage |
|:--------:|:-------:|:--------:|:-------:|
| ![Next.js](https://img.shields.io/badge/-Next.js-black?style=flat-square&logo=next.js) | ![Firebase](https://img.shields.io/badge/-Firebase-red?style=flat-square&logo=firebase) | ![Firestore](https://img.shields.io/badge/-Firestore-black?style=flat-square&logo=firebase) | ![Supabase](https://img.shields.io/badge/-Supabase-red?style=flat-square&logo=supabase) |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-black?style=flat-square&logo=typescript) | ![Node.js](https://img.shields.io/badge/-Node.js-red?style=flat-square&logo=node.js) | ![Supabase](https://img.shields.io/badge/-PostgreSQL-black?style=flat-square&logo=postgresql) | ![Firebase Storage](https://img.shields.io/badge/-Storage-red?style=flat-square&logo=firebase) |
| ![Tailwind](https://img.shields.io/badge/-Tailwind-black?style=flat-square&logo=tailwind-css) | ![Socket.io](https://img.shields.io/badge/-Socket.io-red?style=flat-square&logo=socket.io) | | |

</div>

---

### 📦 Installation

```bash
# Clone the repository
git clone https://github.com/HouseGram-code/HouseGram-Web.git

# Navigate to project directory
cd HouseGram-Web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase & Supabase credentials

# Run development server
npm run dev
```

<div align="center">

🌐 Open [http://localhost:3000](http://localhost:3000) in your browser

</div>

---

### ⚙️ Configuration

#### 1️⃣ Firebase Setup

```javascript
// .env.local
NEXT_PUBLIC_FIREBASE_CONFIG={"projectId":"your-project-id",...}
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

#### 2️⃣ Supabase Setup

```javascript
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 3️⃣ Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

#### 4️⃣ Run Database Migrations

Execute SQL files in Supabase Dashboard → SQL Editor:
- `supabase-recreate-tables.sql`
- `supabase-gifts-migration.sql`

---

### 🎯 Usage

#### Creating a Channel
```typescript
1. Navigate to Menu → Create Channel
2. Enter channel name and description
3. Share invite link with users
4. Start broadcasting messages
```

#### Sending Gifts
```typescript
1. Go to Settings → Lightning
2. Select "Send Gift"
3. Choose recipient and gift
4. Confirm transaction
```

---

### 🤝 Contributing

We welcome contributions! Here's how:

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature/AmazingFeature

# 3. Commit your changes
git commit -m '✨ Add some AmazingFeature'

# 4. Push to the branch
git push origin feature/AmazingFeature

# 5. Open a Pull Request
```

#### 📋 Contribution Guidelines

- ✅ Follow TypeScript best practices
- ✅ Write clean, documented code
- ✅ Test your changes thoroughly
- ✅ Update documentation if needed
- ✅ Use conventional commit messages

---

### 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

### 👥 Authors

<div align="center">

**HouseGram Team**

[![GitHub](https://img.shields.io/badge/GitHub-HouseGram--code-black?style=for-the-badge&logo=github)](https://github.com/HouseGram-code)

</div>

---

### 🌟 Star History

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=HouseGram-code/HouseGram-Web&type=Date&theme=dark)](https://star-history.com/#HouseGram-code/HouseGram-Web&Date)

</div>

---

<div align="center">

### 💖 Support The Project

If you like HouseGram, please give it a ⭐!

[![GitHub stars](https://img.shields.io/github/stars/HouseGram-code/HouseGram-Web?style=social)](https://github.com/HouseGram-code/HouseGram-Web/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/HouseGram-code/HouseGram-Web?style=social)](https://github.com/HouseGram-code/HouseGram-Web/network/members)

</div>

---

<a name="russian"></a>

## 🚀 Русская Версия

### ⚡ О Проекте

**HouseGram** — современный мессенджер с богатым функционалом, вдохновленный элегантным дизайном Telegram. Построен на передовых технологиях и предлагает обмен сообщениями в реальном времени, каналы, обмен файлами и уникальную систему подарков на основе валюты "Молнии".

<div align="center">

### ✨ Ключевые Возможности

</div>

```diff
+ 💬 Обмен Сообщениями          - Мгновенная доставка через Firebase
+ 📢 Каналы и Трансляции         - Создание и управление публичными каналами
+ 🎁 Система Подарков            - Отправка подарков за валюту "Молнии"
+ 📁 Обмен Файлами               - Изображения, видео, аудио, документы
+ 🎨 Настраиваемые Темы          - Множество цветовых схем и обоев
+ 🔒 Безопасность и Приватность  - Готовность к сквозному шифрованию
+ 📱 Поддержка PWA               - Установка как мобильное приложение
+ 🌙 Темная Тема                 - Удобный для глаз интерфейс
+ ⚡ Молниеносная Скорость       - Оптимизированная производительность
+ 🔔 Push-Уведомления            - Будьте в курсе с FCM
```

---

### 🛠️ Технологический Стек

<div align="center">

| Фронтенд | Бэкенд | База Данных | Хранилище |
|:--------:|:------:|:-----------:|:---------:|
| ![Next.js](https://img.shields.io/badge/-Next.js-black?style=flat-square&logo=next.js) | ![Firebase](https://img.shields.io/badge/-Firebase-red?style=flat-square&logo=firebase) | ![Firestore](https://img.shields.io/badge/-Firestore-black?style=flat-square&logo=firebase) | ![Supabase](https://img.shields.io/badge/-Supabase-red?style=flat-square&logo=supabase) |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-black?style=flat-square&logo=typescript) | ![Node.js](https://img.shields.io/badge/-Node.js-red?style=flat-square&logo=node.js) | ![Supabase](https://img.shields.io/badge/-PostgreSQL-black?style=flat-square&logo=postgresql) | ![Firebase Storage](https://img.shields.io/badge/-Storage-red?style=flat-square&logo=firebase) |
| ![Tailwind](https://img.shields.io/badge/-Tailwind-black?style=flat-square&logo=tailwind-css) | ![Socket.io](https://img.shields.io/badge/-Socket.io-red?style=flat-square&logo=socket.io) | | |

</div>

---

### 📦 Установка

```bash
# Клонируйте репозиторий
git clone https://github.com/HouseGram-code/HouseGram-Web.git

# Перейдите в директорию проекта
cd HouseGram-Web

# Установите зависимости
npm install

# Настройте переменные окружения
cp .env.example .env.local
# Отредактируйте .env.local, добавив ваши учетные данные Firebase и Supabase

# Запустите сервер разработки
npm run dev
```

<div align="center">

🌐 Откройте [http://localhost:3000](http://localhost:3000) в браузере

</div>

---

### ⚙️ Конфигурация

#### 1️⃣ Настройка Firebase

```javascript
// .env.local
NEXT_PUBLIC_FIREBASE_CONFIG={"projectId":"ваш-project-id",...}
NEXT_PUBLIC_FIREBASE_VAPID_KEY=ваш-vapid-ключ
FIREBASE_PROJECT_ID=ваш-project-id
FIREBASE_CLIENT_EMAIL=email-сервисного-аккаунта
FIREBASE_PRIVATE_KEY=ваш-приватный-ключ
```

#### 2️⃣ Настройка Supabase

```javascript
NEXT_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-anon-ключ
```

#### 3️⃣ Развертывание Правил Firestore

```bash
firebase deploy --only firestore:rules
```

#### 4️⃣ Запуск Миграций Базы Данных

Выполните SQL файлы в Supabase Dashboard → SQL Editor:
- `supabase-recreate-tables.sql`
- `supabase-gifts-migration.sql`

---

### 🎯 Использование

#### Создание Канала
```typescript
1. Перейдите в Меню → Создать Канал
2. Введите название и описание канала
3. Поделитесь ссылкой-приглашением с пользователями
4. Начните публиковать сообщения
```

#### Отправка Подарков
```typescript
1. Перейдите в Настройки → Молнии
2. Выберите "Отправить подарок"
3. Выберите получателя и подарок
4. Подтвердите транзакцию
```

---

### 🤝 Участие в Разработке

Мы приветствуем вклад в проект! Вот как это сделать:

```bash
# 1. Форкните репозиторий
# 2. Создайте ветку для новой функции
git checkout -b feature/НоваяФункция

# 3. Закоммитьте изменения
git commit -m '✨ Добавлена новая функция'

# 4. Отправьте изменения в ветку
git push origin feature/НоваяФункция

# 5. Откройте Pull Request
```

#### 📋 Правила Участия

- ✅ Следуйте лучшим практикам TypeScript
- ✅ Пишите чистый, документированный код
- ✅ Тщательно тестируйте изменения
- ✅ Обновляйте документацию при необходимости
- ✅ Используйте conventional commit messages

---

### 📜 Лицензия

Распространяется под лицензией MIT. См. `LICENSE` для подробностей.

---

### 👥 Авторы

<div align="center">

**Команда HouseGram**

[![GitHub](https://img.shields.io/badge/GitHub-HouseGram--code-black?style=for-the-badge&logo=github)](https://github.com/HouseGram-code)

</div>

---

### 🌟 История Звезд

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=HouseGram-code/HouseGram-Web&type=Date&theme=dark)](https://star-history.com/#HouseGram-code/HouseGram-Web&Date)

</div>

---

<div align="center">

### 💖 Поддержите Проект

Если вам нравится HouseGram, поставьте ⭐!

[![GitHub stars](https://img.shields.io/github/stars/HouseGram-code/HouseGram-Web?style=social)](https://github.com/HouseGram-code/HouseGram-Web/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/HouseGram-code/HouseGram-Web?style=social)](https://github.com/HouseGram-code/HouseGram-Web/network/members)

</div>

---

<div align="center">

<img src="https://user-images.githubusercontent.com/74038190/212284158-e840e285-664b-44d7-b79b-e264b5e54825.gif" width="400">

### Made with ❤️ by HouseGram Team

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=170&section=footer&text=Thank%20You!&fontSize=42&fontColor=fff&animation=twinkling&fontAlignY=72"/>

</div>
