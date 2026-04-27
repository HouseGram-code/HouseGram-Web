'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BotAPIDocsPage() {
  const router = useRouter();
  const [content, setContent] = useState('');

  useEffect(() => {
    // Загружаем содержимое документации
    fetch('/docs/bot-api.md')
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(err => console.error('Error loading docs:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">HouseGram Bot API 0.1</h1>
            <p className="text-sm text-blue-100">Документация для разработчиков</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
              {content || 'Загрузка документации...'}
            </pre>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://github.com/HouseGram-code/HouseGram-Web"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 text-white rounded-lg p-4 hover:bg-gray-700 transition"
          >
            <h3 className="font-semibold mb-2">📦 GitHub</h3>
            <p className="text-sm text-gray-300">Исходный код проекта</p>
          </a>

          <a
            href="/examples/bot-example.js"
            download
            className="bg-blue-600 text-white rounded-lg p-4 hover:bg-blue-700 transition"
          >
            <h3 className="font-semibold mb-2">💡 Примеры</h3>
            <p className="text-sm text-blue-100">Скачать примеры ботов</p>
          </a>

          <button
            onClick={() => router.push('/')}
            className="bg-green-600 text-white rounded-lg p-4 hover:bg-green-700 transition text-left"
          >
            <h3 className="font-semibold mb-2">🤖 BotMaster</h3>
            <p className="text-sm text-green-100">Создать своего бота</p>
          </button>
        </div>
      </div>
    </div>
  );
}
