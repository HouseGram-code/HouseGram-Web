import { supabase } from './supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Адаптер для замены Firebase на Supabase

// Auth
export const auth = {
  currentUser: null as SupabaseUser | null,
  
  async initialize() {
    const { data: { user } } = await supabase.auth.getUser();
    this.currentUser = user;
    return user;
  },

  onAuthStateChanged(callback: (user: SupabaseUser | null) => void) {
    // Инициализация
    this.initialize().then(callback);
    
    // Подписка на изменения
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser = session?.user || null;
      callback(session?.user || null);
    });
    
    return () => subscription.unsubscribe();
  },

  async signOut() {
    await supabase.auth.signOut();
    this.currentUser = null;
  }
};

// Database operations
export const db = {
  // Users
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async createUser(userId: string, userData: any) {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        ...userData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { data: data || [], error };
  },

  // Chats
  async getChats(userId: string) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participants', [userId])
      .order('updated_at', { ascending: false });
    
    return { data: data || [], error };
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

  async updateChat(chatId: string, updates: any) {
    const { data, error } = await supabase
      .from('chats')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId)
      .select()
      .single();
    
    return { data, error };
  },

  // Messages
  async getMessages(chatId: string, limitCount = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(limitCount);
    
    return { data: data || [], error };
  },

  async sendMessage(messageData: any) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        ...messageData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async updateMessage(messageId: string, updates: any) {
    const { data, error } = await supabase
      .from('messages')
      .update({
        ...updates,
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

  // Channels
  async getChannels(userId: string) {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .contains('subscribers', [userId])
      .order('created_at', { ascending: false });
    
    return { data: data || [], error };
  },

  async createChannel(channelData: any) {
    const { data, error } = await supabase
      .from('channels')
      .insert([{
        ...channelData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async updateChannel(channelId: string, updates: any) {
    const { data, error } = await supabase
      .from('channels')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', channelId)
      .select()
      .single();
    
    return { data, error };
  },

  async getChannelPosts(channelId: string, limitCount = 50) {
    const { data, error } = await supabase
      .from('channel_posts')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(limitCount);
    
    return { data: data || [], error };
  },

  async createChannelPost(postData: any) {
    const { data, error } = await supabase
      .from('channel_posts')
      .insert([{
        ...postData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  // Settings
  async getSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'global')
      .single();
    
    return { data, error };
  },

  async updateSettings(settings: any) {
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        key: 'global',
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    return { data, error };
  },

  // Real-time subscriptions
  subscribeToMessages(chatId: string, callback: (message: any) => void) {
    return supabase
      .channel(`messages:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
  },

  subscribeToUser(userId: string, callback: (user: any) => void) {
    return supabase
      .channel(`user:${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
  },

  subscribeToChats(userId: string, callback: (chat: any) => void) {
    return supabase
      .channel(`chats:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats'
      }, (payload) => {
        // Фильтруем только чаты пользователя
        const newData = payload.new as any;
        if (newData && Array.isArray(newData.participants) && newData.participants.includes(userId)) {
          callback(newData);
        }
      })
      .subscribe();
  }
};

// Storage operations
export const storage = {
  async uploadFile(path: string, file: File | Blob, options?: any) {
    const { data, error } = await supabase.storage
      .from('files')
      .upload(path, file, options);
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(path);
    
    return { url: urlData.publicUrl, data, error: null };
  },

  async getPublicUrl(path: string) {
    const { data } = supabase.storage
      .from('files')
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  async deleteFile(path: string) {
    const { error } = await supabase.storage
      .from('files')
      .remove([path]);
    
    return { error };
  }
};

// Helper functions
export const serverTimestamp = () => new Date().toISOString();

export const arrayUnion = (...elements: any[]) => {
  // Supabase использует PostgreSQL массивы
  return elements;
};

export const increment = (value: number) => {
  // Для Supabase нужно использовать SQL функции
  return value;
};

// Auth providers
export const GoogleAuthProvider = {
  async signIn() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  }
};

export const EmailAuthProvider = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  }
};
