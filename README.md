# 🏠 HouseGram Web
### <span style="color:red">🔥 The Ultimate Secure Messaging Platform</span>

<div align="center">

![Status](https://img.shields.io/badge/Status-Stable-red?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-2.0.0-black?style=for-the-badge&logo=github)
![License](https://img.shields.io/badge/License-MIT-red?style=for-the-badge)

> **⚡️ Быстро. Безопасно. Стильно.** <br>
> Современный веб-мессенджер с акцентом на приватность и пользовательский опыт.

</div>

---

## 🎨 Визуальный Стиль & Атмосфера
Мы выбрали агрессивную, но элегантную тему **Black & Red**, чтобы подчеркнуть мощность и безопасность вашего общения.

```text
██████╗  ██████╗ ██╗     ██╗     ██╗███╗   ██╗ ██████╗ 
██╔══██╗██╔═══██╗██║     ██║     ██║████╗  ██║██╔════╝ 
██████╔╝██║   ██║██║     ██║     ██║██╔██╗ ██║██║  ███╗
██╔══██╗██║   ██║██║     ██║     ██║██║╚██╗██║██║   ██║
██████╔╝╚██████╔╝███████╗███████╗██║██║ ╚████║╚██████╔╝
╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
>>> SYSTEM ONLINE | ENCRYPTION ACTIVE | BLOCK PROTOCOL ENGAGED
```

---

## 🛡️ Последние Обновления (Changelog)

### 🔴 v2.0.1 — Critical Privacy Fix
> **ИСПРАВЛЕНИЕ БАГА БЛОКИРОВКИ**
*   **Проблема:** При блокировке пользователя сообщения визуально исчезали у обоих собеседников или отображались некорректно.
*   **Решение:** Реализована строгая логика фильтрации. Теперь:
    *   ✅ Сообщения скрыты только от заблокированного пользователя.
    *   ✅ История чата сохраняется для владельца аккаунта.
    *   ✅ Мгновенное обновление интерфейса без перезагрузки.

### ⚫ v2.0.0 — Major UI Overhaul
*   Полный редизайн в стиле **Dark/Red Cyberpunk**.
*   Улучшенная анимация появления сообщений.
*   Оптимизация скорости загрузки на 40%.

---

## 📜 Правила Проекта (Code of Conduct)

Чтобы сохранить атмосферу HouseGram, придерживайтесь следующих правил:

| # | Правило | Описание |
|:-:|:-------:|:---------|
| 1 | 🔒 **Приватность** | Никакого сбора личных данных третьим лицам. Блокировка работает на уровне ядра. |
| 2 | ⚡ **Производительность** | Код должен быть чистым. Любое замедление интерфейса недопустимо. |
| 3 | 🎨 **Стиль** | Интерфейс должен соответствовать черно-красной теме. Никаких "кислотных" цветов. |
| 4 | 🤝 **Уважение** | Запрещены токсичные коммиты и оскорбления в обсуждениях. |

---

## 🚀 Быстрый Старт

### 1. Клонирование
```bash
git clone https://github.com/HouseGram-code/HouseGram-Web.git
cd HouseGram-Web
```

### 2. Установка зависимостей
```bash
npm install
# или
yarn install
```

### 3. Запуск разработки
```bash
npm run dev
```
> Приложение запустится на `http://localhost:3000` с горячей перезагрузкой.

### 4. Сборка для продакшена
```bash
npm run build
```

---

## 🛠️ Решение Проблем (Troubleshooting)

Если вы столкнулись с ошибками, проверьте этот раздел перед созданием Issue.

### ❌ Проблема: Сообщения не отправляются
*   **Причина:** Возможно, вы заблокированы администратором или собеседником.
*   **Решение:** Проверьте статус чата. Если видите значок 🚫, связь ограничена.

### ❌ Проблема: Черный экран после сборки
*   **Причина:** Ошибка в переменных окружения `.env`.
*   **Решение:** Убедитесь, что файл `.env` существует и содержит ключи `VITE_API_URL` и `VITE_WS_URL`.

### ❌ Проблема: Конфликты при Git Push
*   **Причина:** Изменения на сервере новее локальных.
*   **Решение:**
    ```bash
    git pull origin main --rebase
    # Разрешите конфликты, затем:
    git push origin main
    ```

---

## 🌐 Технологии

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

</div>

---

## 📞 Контакты и Поддержка

Есть идеи или нашли баг? Открывай Issue или пиши нам.

*   📧 **Email:** support@housegram.web
*   🐙 **GitHub Issues:** [Сообщить о проблеме](https://github.com/HouseGram-code/HouseGram-Web/issues)

<div align="center">

### 🩸 Made with ❤️ and 🔥 by HouseGram Team
**Stay Secure. Stay Dark.**

</div>
