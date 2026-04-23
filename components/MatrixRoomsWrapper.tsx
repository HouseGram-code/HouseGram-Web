'use client';

import { useChat } from '@/context/ChatContext';
import MatrixRoomsView from './MatrixRoomsView';

export default function MatrixRoomsWrapper() {
  const { setView } = useChat();
  
  return (
    <MatrixRoomsView onBack={() => setView('menu')} />
  );
}