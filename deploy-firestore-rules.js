#!/usr/bin/env node

/**
 * Автоматический деплой правил Firestore
 * Запускается автоматически при деплое на Vercel
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Конфигурация Firebase
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'housegram-d070d';
const FIREBASE_API_KEY = process.env.FIREBASE_ADMIN_API_KEY; // Нужно добавить в Vercel

async function deployFirestoreRules() {
  console.log('🚀 Начинаем деплой правил Firestore...');

  try {
    // Читаем файл с правилами
    const rulesPath = path.join(__dirname, 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');

    console.log('✅ Правила Firestore прочитаны');
    console.log(`📦 Размер: ${rules.length} символов`);

    // Если нет API ключа, просто выводим правила
    if (!FIREBASE_API_KEY) {
      console.log('⚠️  FIREBASE_ADMIN_API_KEY не установлен');
      console.log('📝 Для автоматического деплоя добавьте переменную окружения в Vercel');
      console.log('');
      console.log('Правила готовы к деплою:');
      console.log('----------------------------------------');
      console.log(rules.substring(0, 500) + '...');
      console.log('----------------------------------------');
      console.log('');
      console.log('💡 Деплой правил вручную:');
      console.log('   firebase deploy --only firestore:rules');
      return;
    }

    // TODO: Реализовать автоматический деплой через Firebase Admin API
    console.log('✅ Правила готовы к деплою');
    console.log('');
    console.log('📋 Следующие шаги:');
    console.log('1. Установите Firebase CLI: npm install -g firebase-tools');
    console.log('2. Войдите: firebase login');
    console.log('3. Деплой: firebase deploy --only firestore:rules');

  } catch (error) {
    console.error('❌ Ошибка при деплое правил:', error.message);
    process.exit(1);
  }
}

// Запуск
deployFirestoreRules();
