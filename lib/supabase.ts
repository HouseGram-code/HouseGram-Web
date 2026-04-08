import { createClient } from '@supabase/supabase-js';

// Supabase конфигурация (бесплатная альтернатива Firebase)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Типы для базы данных
export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  status: 'online' | 'offline';
  last_seen: string;
  is_official: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  type: 'text' | 'audio' | 'file' | 'sticker' | 'gif';
  file_url?: string;
  file_name?: string;
  sticker_url?: string;
  gif_url?: string;
  reply_to?: string;
  created_at: string;
  updated_at?: string;
  status: 'sending' | 'sent' | 'read';
}

export interface Chat {
  id: string;
  participants: string[];
  last_message?: string;
  last_message_sender_id?: string;
  updated_at: string;
  created_at: string;
}

// Функции для работы с пользователями
export const userService = {
  async updateStatus(userId: string, status: 'online' | 'offline') {
    const { error } = await supabase
      .from('users')
      .update({ 
        status, 
        last_seen: new Date().toISOString() 
      })
      .eq('id', userId);
    
    if (error) console.error('Error updating status:', error);
    return !error;
  },

  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async searchUsers(query: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(20);
    
    return { data, error };
  },

  subscribeToUserStatus(userId: string, callback: (user: User) => void) {
    return supabase
      .channel(`user:${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      }, (payload) => {
        callback(payload.new as User);
      })
      .subscribe();
  }
};

// Функции для работы с сообщениями
export const messageService = {
  async sendMessage(message: Omit<Message, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        ...message,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async getMessages(chatId: string, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  async updateMessage(messageId: string, text: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ 
        text, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', messageId)
      .select()
      .single();
    
    return { data, error };
  },

  async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    
    return { error };
  },

  subscribeToMessages(chatId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        callback(payload.new as Message);
      })
      .subscribe();
  }
};

// Функции для работы с чатами
export const chatService = {
  async getChats(userId: string) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participants', [userId])
      .order('updated_at', { ascending: false });
    
    return { data, error };
  },

  async createChat(participants: string[]) {
    const { data, error } = await supabase
      .from('chats')
      .insert([{
        participants,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async updateLastMessage(chatId: string, message: string, senderId: string) {
    const { error } = await supabase
      .from('chats')
      .update({
        last_message: message,
        last_message_sender_id: senderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);
    
    return { error };
  }
};
