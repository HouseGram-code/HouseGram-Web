'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Bot, 
  Plus, 
  Settings, 
  Trash2, 
  Copy, 
  Check,
  RefreshCw,
  Code,
  Terminal,
  Book
} from 'lucide-react';
import { BotFather, Bot as BotType } from '@/lib/botApi';

type Step = 'list' | 'create-name' | 'create-username' | 'bot-created' | 'bot-settings';

export default function BotMasterView() {
  const { setView, themeColor, user } = useChat();
  const [step, setStep] = useState<Step>('list');
  const [bots, setBots] = useState<BotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState<BotType | null>(null);
  
  // Create bot states
  const [botName, setBotName] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [createdBot, setCreatedBot] = useState<{ bot: BotType; token: string } | null>(null);
  const [error, setError] = useState('');
  
  // UI states
  const [copiedToken, setCopiedToken] = useState(false);

  const botFather = user ? new BotFather(user.uid) : null;

  useEffect(() => {
    loadBots();
  }, [user]);

  const loadBots = async () => {
    if (!botFather) return;
    
    setLoading(true);
    const userBots = await botFather.getMyBots();
    setBots(userBots);
    setLoading(false);
  };

  const handleCreateBot = async () => {
    if (!botFather) return;
    
    if (step === 'create-name') {
      if (!botName.trim()) {
        setError('Введите имя бота');
        return;
      }
      setError('');
      setStep('create-username');
      return;
    }

    if (step === 'create-username') {
      if (!botUsername.trim()) {
        setError('Введите username бота');
        return;
      }

      if (!botUsername.endsWith('bot')) {
        setError('Username должен заканчиваться на "bot"');
        return;
      }

      setLoading(true);
      const result = await botFather.createBot(botName, botUsername);
      setLoading(false);

      if (result.success && result.bot && result.token) {
        setCreatedBot({ bot: result.bot, token: result.token });
        setStep('bot-created');
        loadBots();
      } else {
        setError(result.error || 'Ошибка создания бота');
      }
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleDeleteBot = async (botId: string) => {
    if (!botFather) return;
    
    if (!confirm('Вы уверены, что хотите удалить этого бота?')) return;

    setLoading(true);
    await botFather.deleteBot(botId);
    await loadBots();
    setLoading(false);
    setStep('list');
  };

  const handleRevokeToken = async (botId: string) => {
    if (!botFather) return;
    
    if (!confirm('Старый токен перестанет работать. Продолжить?')) return;

    setLoading(true);
    const result = await botFather.revokeToken(botId);
    setLoading(false);

    if (result.success && result.token) {
      alert(`Новый токен:\n${result.token}`);
      await loadBots();
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="absolute inset-0 bg-white dark:bg-gray-900 flex flex-col z-10"
    >
      {/* Header */}
      <div
        className="px-4 h-14 flex items-center gap-3 text-white"
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => {
          if (step === 'list') {
            setView('menu');
          } else {
            setStep('list');
            setError('');
            setBotName('');
            setBotUsername('');
          }
        }}>
          <ArrowLeft size={24} />
        </button>
        <Bot size={24} />
        <h1 className="text-lg font-semibold">BotMaster</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Bot List */}
          {step === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              {/* Welcome Message */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Bot className="text-blue-500" />
                  Добро пожаловать в BotMaster!
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Я помогу вам создать и настроить ботов для HouseGram.
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                  <p>📝 /newbot - Создать нового бота</p>
                  <p>🤖 /mybots - Список ваших ботов</p>
                  <p>📖 /help - Помощь и документация</p>
                </div>
              </div>

              {/* Create Bot Button */}
              <button
                onClick={() => setStep('create-name')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-4 mb-4 flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                <Plus size={20} />
                <span className="font-semibold">Создать нового бота</span>
              </button>

              {/* Documentation Button */}
              <button
                onClick={() => window.open('/docs/bot-api.md', '_blank')}
                className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4 flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <Book size={20} />
                <span className="font-semibold">Документация Bot API</span>
              </button>

              {/* Bots List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                  Мои боты ({bots.length})
                </h3>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Загрузка...
                  </div>
                ) : bots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    У вас пока нет ботов
                  </div>
                ) : (
                  bots.map(bot => (
                    <div
                      key={bot.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                      onClick={() => {
                        setSelectedBot(bot);
                        setStep('bot-settings');
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <Bot className="text-white" size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{bot.name}</h4>
                          <p className="text-sm text-gray-500">@{bot.username}</p>
                        </div>
                        <Settings size={20} className="text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Create Bot - Name */}
          {step === 'create-name' && (
            <motion.div
              key="create-name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <p className="text-sm">
                  Хорошо! Как назовем вашего бота? Это имя будет видно пользователям.
                </p>
              </div>

              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="Например: My Awesome Bot"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 mb-2"
                autoFocus
              />

              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}

              <button
                onClick={handleCreateBot}
                disabled={!botName.trim()}
                className="w-full bg-blue-500 text-white rounded-lg py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition"
              >
                Далее
              </button>
            </motion.div>
          )}

          {/* Create Bot - Username */}
          {step === 'create-username' && (
            <motion.div
              key="create-username"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <p className="text-sm mb-2">
                  Отлично! Теперь выберите username для бота.
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Username должен заканчиваться на <code className="bg-white dark:bg-gray-800 px-1 rounded">bot</code>
                </p>
              </div>

              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500">@</span>
                  <input
                    type="text"
                    value={botUsername}
                    onChange={(e) => setBotUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="my_awesome_bot"
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 ml-8">
                  Только латиница, цифры и подчеркивания
                </p>
              </div>

              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}

              <button
                onClick={handleCreateBot}
                disabled={!botUsername.trim() || loading}
                className="w-full bg-blue-500 text-white rounded-lg py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition"
              >
                {loading ? 'Создание...' : 'Создать бота'}
              </button>
            </motion.div>
          )}

          {/* Bot Created */}
          {step === 'bot-created' && createdBot && (
            <motion.div
              key="bot-created"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-4"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="text-white" size={40} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Готово! 🎉</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Ваш бот успешно создан
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{createdBot.bot.name}</h3>
                    <p className="text-sm text-gray-500">@{createdBot.bot.username}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-1">Bot Token:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs break-all font-mono">
                      {createdBot.token}
                    </code>
                    <button
                      onClick={() => handleCopyToken(createdBot.token)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                    >
                      {copiedToken ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-3">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    ⚠️ Сохраните токен в безопасном месте! Он нужен для управления ботом через API.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => window.open('/docs/bot-api.md', '_blank')}
                  className="w-full bg-blue-500 text-white rounded-lg py-3 font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
                >
                  <Book size={20} />
                  Документация API
                </button>

                <button
                  onClick={() => {
                    setStep('list');
                    setCreatedBot(null);
                    setBotName('');
                    setBotUsername('');
                  }}
                  className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg py-3 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Вернуться к списку
                </button>
              </div>
            </motion.div>
          )}

          {/* Bot Settings */}
          {step === 'bot-settings' && selectedBot && (
            <motion.div
              key="bot-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="text-white" size={32} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedBot.name}</h3>
                    <p className="text-sm text-gray-500">@{selectedBot.username}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded p-3">
                  <p className="text-xs text-gray-500 mb-1">Bot Token:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs break-all font-mono">
                      {selectedBot.token}
                    </code>
                    <button
                      onClick={() => handleCopyToken(selectedBot.token)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                    >
                      {copiedToken ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleRevokeToken(selectedBot.id)}
                  className="w-full bg-orange-500 text-white rounded-lg py-3 font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  Обновить токен
                </button>

                <button
                  onClick={() => window.open('/docs/bot-api.md', '_blank')}
                  className="w-full bg-blue-500 text-white rounded-lg py-3 font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
                >
                  <Terminal size={20} />
                  API Документация
                </button>

                <button
                  onClick={() => handleDeleteBot(selectedBot.id)}
                  className="w-full bg-red-500 text-white rounded-lg py-3 font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  Удалить бота
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
