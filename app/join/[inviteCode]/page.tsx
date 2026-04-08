'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';
import { Users, Check, X } from 'lucide-react';

export default function JoinChannelPage({ params }: { params: { inviteCode: string } }) {
  const router = useRouter();
  const [channelData, setChannelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadChannel = async () => {
      try {
        const inviteDoc = await getDoc(doc(db, 'invites', params.inviteCode));
        
        if (!inviteDoc.exists()) {
          setError('Приглашение не найдено или устарело');
          setLoading(false);
          return;
        }

        const inviteData = inviteDoc.data();
        const channelDoc = await getDoc(doc(db, 'channels', inviteData.channelId));
        
        if (!channelDoc.exists()) {
          setError('Канал не найден');
          setLoading(false);
          return;
        }

        const channel = channelDoc.data();
        setChannelData({ ...channel, id: inviteData.channelId });

        if (user && channel.subscribers?.includes(user.uid)) {
          setAlreadyJoined(true);
        }
      } catch (err) {
        console.error('Error loading channel:', err);
        setError('Ошибка загрузки канала');
      } finally {
        setLoading(false);
      }
    };

    loadChannel();
  }, [params.inviteCode, user]);

  const handleJoin = async () => {
    if (!user) {
      router.push('/');
      return;
    }

    setJoining(true);
    try {
      await updateDoc(doc(db, 'channels', channelData.id), {
        subscribers: arrayUnion(user.uid),
        subscribersCount: increment(1)
      });

      router.push('/');
    } catch (err) {
      console.error('Error joining channel:', err);
      alert('Ошибка при присоединении к каналу');
    } finally {
      setJoining(false);
    }
  };

  const handleDecline = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/30">
            {channelData?.avatarUrl ? (
              <Image src={channelData.avatarUrl} alt="Channel" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-4xl font-bold">
                {channelData?.name?.charAt(0).toUpperCase() || 'C'}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">{channelData?.name}</h1>
          <div className="flex items-center justify-center gap-2 text-white/90">
            <Users size={18} />
            <span>{channelData?.subscribersCount || 0} подписчиков</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {channelData?.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Описание</h3>
              <p className="text-gray-800">{channelData.description}</p>
            </div>
          )}

          {alreadyJoined ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-3">
              <Check size={24} className="text-green-500" />
              <div>
                <div className="font-medium text-green-900">Вы уже подписаны</div>
                <div className="text-sm text-green-700">Откройте приложение для просмотра</div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                Присоединитесь к каналу, чтобы получать обновления и новости
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {!alreadyJoined ? (
              <>
                <button
                  onClick={handleJoin}
                  disabled={joining || !user}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {joining ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Присоединение...</span>
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      <span>Присоединиться</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={joining}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                Открыть приложение
              </button>
            )}
          </div>

          {!user && (
            <p className="text-xs text-gray-500 text-center mt-4">
              Войдите в приложение, чтобы присоединиться к каналу
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-semibold">HouseGram</span>
          </p>
        </div>
      </div>
    </div>
  );
}
