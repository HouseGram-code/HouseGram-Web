'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Wifi, WifiOff, Globe, Shield, CheckCircle, AlertCircle, Copy, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProxyServer {
  id: string;
  name: string;
  host: string;
  port: number;
  type: 'MTProto' | 'SOCKS5';
  secret?: string;
  username?: string;
  password?: string;
  country: string;
  flag: string;
  ping: number;
  status: 'online' | 'offline' | 'checking';
}

const freeProxyServers: ProxyServer[] = [
  {
    id: 'de1',
    name: 'Germany #1',
    host: 'proxy-de1.codioo.com',
    port: 443,
    type: 'MTProto',
    secret: 'ee0b99c4a681efebc13b138475f1c8b9d4',
    country: 'Germany',
    flag: '🇩🇪',
    ping: 42,
    status: 'online'
  },
  {
    id: 'fi1',
    name: 'Finland #1',
    host: 'proxy-fi1.codioo.com',
    port: 443,
    type: 'MTProto',
    secret: 'ee0b99c4a681efebc13b138475f1c8b9d4',
    country: 'Finland',
    flag: '🇫🇮',
    ping: 38,
    status: 'online'
  },
  {
    id: 'nl1',
    name: 'Netherlands #1',
    host: 'proxy-nl1.codioo.com',
    port: 443,
    type: 'MTProto',
    secret: 'ee0b99c4a681efebc13b138475f1c8b9d4',
    country: 'Netherlands',
    flag: '🇳🇱',
    ping: 51,
    status: 'online'
  },
  {
    id: 'sg1',
    name: 'Singapore #1',
    host: 'proxy-sg1.codioo.com',
    port: 443,
    type: 'MTProto',
    secret: 'ee0b99c4a681efebc13b138475f1c8b9d4',
    country: 'Singapore',
    flag: '🇸🇬',
    ping: 89,
    status: 'online'
  },
  {
    id: 'us1',
    name: 'United States #1',
    host: 'proxy-us1.codioo.com',
    port: 1080,
    type: 'SOCKS5',
    username: 'free',
    password: 'codioo2026',
    country: 'United States',
    flag: '🇺🇸',
    ping: 112,
    status: 'online'
  }
];

export default function ProxyView() {
  const { setView, themeColor, isDarkMode } = useChat();
  const [selectedProxy, setSelectedProxy] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [showAddProxy, setShowAddProxy] = useState(false);
  const [customProxy, setCustomProxy] = useState({
    name: '',
    host: '',
    port: '',
    type: 'MTProto' as 'MTProto' | 'SOCKS5',
    secret: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    // Загружаем сохраненные настройки прокси
    const savedProxy = localStorage.getItem('housegram_proxy');
    if (savedProxy) {
      const proxy = JSON.parse(savedProxy);
      setSelectedProxy(proxy.id);
      setConnectionStatus(proxy.connected ? 'connected' : 'disconnected');
    }
  }, []);

  const handleConnect = async (proxy: ProxyServer) => {
    setIsConnecting(true);
    setSelectedProxy(proxy.id);
    
    try {
      // Симуляция подключения к прокси
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Сохраняем настройки прокси
      localStorage.setItem('housegram_proxy', JSON.stringify({
        id: proxy.id,
        host: proxy.host,
        port: proxy.port,
        type: proxy.type,
        secret: proxy.secret,
        username: proxy.username,
        password: proxy.password,
        connected: true
      }));
      
      setConnectionStatus('connected');
      
      // Показываем уведомление об успешном подключении
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch (error) {
      console.error('Proxy connection failed:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('housegram_proxy');
    setSelectedProxy(null);
    setConnectionStatus('disconnected');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const getProxyUrl = (proxy: ProxyServer) => {
    if (proxy.type === 'MTProto') {
      return `tg://proxy?server=${proxy.host}&port=${proxy.port}&secret=${proxy.secret}`;
    } else {
      return `tg://socks?server=${proxy.host}&port=${proxy.port}&user=${proxy.username}&pass=${proxy.password}`;
    }
  };

  const openInTelegram = (proxy: ProxyServer) => {
    const url = getProxyUrl(proxy);
    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`absolute inset-0 flex flex-col z-20 ${isDarkMode ? 'bg-[#0f0f0f] text-white' : 'bg-white text-black'}`}
    >
      {/* Header */}
      <div 
        className="text-white px-2.5 h-14 flex items-center gap-4 shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => setView('settings')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium">Прокси</div>
        <button 
          onClick={() => setShowAddProxy(true)}
          className="px-3 py-1.5 bg-white/20 rounded-full text-[14px] font-medium hover:bg-white/30 transition-colors"
        >
          Добавить
        </button>
      </div>

      {/* Content */}
      <div className={`flex-grow overflow-y-auto ${isDarkMode ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
        {/* Connection Status */}
        <div className={`mx-4 mt-4 p-4 rounded-2xl ${isDarkMode ? 'bg-[#1c1c1d]' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              connectionStatus === 'connected' ? 'bg-green-100' : 
              connectionStatus === 'connecting' ? 'bg-yellow-100' : 'bg-gray-100'
            }`}>
              {connectionStatus === 'connected' ? (
                <Wifi size={20} className="text-green-600" />
              ) : connectionStatus === 'connecting' ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw size={20} className="text-yellow-600" />
                </motion.div>
              ) : (
                <WifiOff size={20} className="text-gray-500" />
              )}
            </div>
            <div className="flex-grow">
              <div className={`text-[16px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {connectionStatus === 'connected' ? 'Подключено к прокси' :
                 connectionStatus === 'connecting' ? 'Подключение...' : 'Прокси отключен'}
              </div>
              <div className={`text-[13px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {connectionStatus === 'connected' ? 'Соединение защищено' :
                 connectionStatus === 'connecting' ? 'Установка соединения' : 'Выберите сервер для подключения'}
              </div>
            </div>
            {connectionStatus === 'connected' && (
              <button 
                onClick={handleDisconnect}
                className="px-3 py-1.5 bg-red-100 text-red-600 rounded-full text-[13px] font-medium hover:bg-red-200 transition-colors"
              >
                Отключить
              </button>
            )}
          </div>
          
          {connectionStatus === 'connected' && selectedProxy && (
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span className="text-[13px] font-medium">
                  Подключен к {freeProxyServers.find(p => p.id === selectedProxy)?.name}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className={`mx-4 mt-4 p-4 rounded-2xl ${isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <div className={`text-[14px] font-medium mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                Что такое прокси?
              </div>
              <div className={`text-[13px] leading-relaxed ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                Прокси помогает обходить блокировки и улучшает скорость подключения к Telegram в некоторых регионах.
              </div>
            </div>
          </div>
        </div>

        {/* Free Proxy Servers */}
        <div className="px-4 mt-6">
          <div className={`text-[15px] font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Бесплатные серверы
          </div>
          
          <div className={`${isDarkMode ? 'bg-[#1c1c1d]' : 'bg-white'} rounded-2xl overflow-hidden shadow-sm`}>
            {freeProxyServers.map((proxy, index) => (
              <div key={proxy.id} className={index > 0 ? `border-t ${isDarkMode ? 'border-[#2c2c2e]' : 'border-gray-100'}` : ''}>
                <div className={`p-4 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[20px]">{proxy.flag}</span>
                    <div className="flex-grow">
                      <div className={`text-[15px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {proxy.name}
                      </div>
                      <div className={`text-[12px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {proxy.type} • {proxy.ping}ms • {proxy.host}:{proxy.port}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        proxy.status === 'online' ? 'bg-green-500' : 
                        proxy.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className={`text-[11px] ${
                        proxy.status === 'online' ? 'text-green-600' : 
                        proxy.status === 'offline' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {proxy.status === 'online' ? 'Онлайн' : 
                         proxy.status === 'offline' ? 'Офлайн' : 'Проверка'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConnect(proxy)}
                      disabled={isConnecting || proxy.status !== 'online'}
                      className={`flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                        selectedProxy === proxy.id && connectionStatus === 'connected'
                          ? 'bg-green-500 text-white'
                          : isConnecting && selectedProxy === proxy.id
                          ? 'bg-yellow-500 text-white'
                          : proxy.status === 'online'
                          ? `${isDarkMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`
                          : `${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} text-gray-500 cursor-not-allowed`
                      }`}
                    >
                      {selectedProxy === proxy.id && connectionStatus === 'connected' ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle size={16} />
                          Подключен
                        </div>
                      ) : isConnecting && selectedProxy === proxy.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <RefreshCw size={16} />
                          </motion.div>
                          Подключение...
                        </div>
                      ) : (
                        'Подключить'
                      )}
                    </button>
                    
                    <button
                      onClick={() => copyToClipboard(`${proxy.host}:${proxy.port}`)}
                      className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                    >
                      <Copy size={16} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                    </button>
                    
                    <button
                      onClick={() => openInTelegram(proxy)}
                      className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                    >
                      <ExternalLink size={16} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Proxy Ad */}
        <div className="px-4 mt-6 mb-6">
          <div className={`p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 text-white`}>
            <div className="flex items-start gap-3">
              <Zap size={24} className="text-yellow-300 shrink-0 mt-1" />
              <div className="flex-grow">
                <div className="text-[16px] font-bold mb-1">Премиум прокси</div>
                <div className="text-[13px] text-white/90 mb-3 leading-relaxed">
                  Получите выделенный IP, гарантию 99.9% аптайма и приоритетную поддержку всего за $3/месяц
                </div>
                <div className="flex items-center gap-4 text-[12px]">
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} />
                    <span>Только ваш IP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} />
                    <span>10 Gbps скорость</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} />
                    <span>5 регионов</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Proxy Modal */}
      <AnimatePresence>
        {showAddProxy && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/50" 
              onClick={() => setShowAddProxy(false)} 
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              className={`w-full max-w-md max-h-[80vh] overflow-hidden z-10 ${isDarkMode ? 'bg-[#1c1c1d]' : 'bg-white'} rounded-t-2xl sm:rounded-2xl`}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className={`text-[18px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Добавить прокси</h3>
                <button 
                  onClick={() => setShowAddProxy(false)} 
                  className={`text-gray-400 hover:text-gray-600`}
                >
                  ✕
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className={`block text-[13px] font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Название
                  </label>
                  <input
                    type="text"
                    value={customProxy.name}
                    onChange={(e) => setCustomProxy({...customProxy, name: e.target.value})}
                    className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-[#2c2c2e] border-[#3c3c3e] text-white' : 'bg-white border-gray-300'} outline-none focus:border-blue-500`}
                    placeholder="Мой прокси"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[13px] font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Хост
                    </label>
                    <input
                      type="text"
                      value={customProxy.host}
                      onChange={(e) => setCustomProxy({...customProxy, host: e.target.value})}
                      className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-[#2c2c2e] border-[#3c3c3e] text-white' : 'bg-white border-gray-300'} outline-none focus:border-blue-500`}
                      placeholder="proxy.example.com"
                    />
                  </div>
                  <div>
                    <label className={`block text-[13px] font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Порт
                    </label>
                    <input
                      type="number"
                      value={customProxy.port}
                      onChange={(e) => setCustomProxy({...customProxy, port: e.target.value})}
                      className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-[#2c2c2e] border-[#3c3c3e] text-white' : 'bg-white border-gray-300'} outline-none focus:border-blue-500`}
                      placeholder="443"
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-[13px] font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Тип
                  </label>
                  <select
                    value={customProxy.type}
                    onChange={(e) => setCustomProxy({...customProxy, type: e.target.value as 'MTProto' | 'SOCKS5'})}
                    className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-[#2c2c2e] border-[#3c3c3e] text-white' : 'bg-white border-gray-300'} outline-none focus:border-blue-500`}
                  >
                    <option value="MTProto">MTProto</option>
                    <option value="SOCKS5">SOCKS5</option>
                  </select>
                </div>
                
                {customProxy.type === 'MTProto' ? (
                  <div>
                    <label className={`block text-[13px] font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Секрет
                    </label>
                    <input
                      type="text"
                      value={customProxy.secret}
                      onChange={(e) => setCustomProxy({...customProxy, secret: e.target.value})}
                      className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-[#2c2c2e] border-[#3c3c3e] text-white' : 'bg-white border-gray-300'} outline-none focus:border-blue-500`}
                      placeholder="ee0b99c4a681efebc13b138475f1c8b9d4"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-[13px] font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Логин
                      </label>
                      <input
                        type="text"
                        value={customProxy.username}
                        onChange={(e) => setCustomProxy({...customProxy, username: e.target.value})}
                        className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-[#2c2c2e] border-[#3c3c3e] text-white' : 'bg-white border-gray-300'} outline-none focus:border-blue-500`}
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <label className={`block text-[13px] font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Пароль
                      </label>
                      <input
                        type="password"
                        value={customProxy.password}
                        onChange={(e) => setCustomProxy({...customProxy, password: e.target.value})}
                        className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-[#2c2c2e] border-[#3c3c3e] text-white' : 'bg-white border-gray-300'} outline-none focus:border-blue-500`}
                        placeholder="password"
                      />
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    // Здесь можно добавить логику сохранения пользовательского прокси
                    setShowAddProxy(false);
                  }}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  Добавить прокси
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}