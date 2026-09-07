/**
 * SUPABASE CLIENT & DATABASE SERVICE
 * Подключение к Supabase: https://algvvdvwpavpmuxllepo.supabase.co
 */

const SUPABASE_CONFIG = {
  url: 'https://algvvdvwpavpmuxllepo.supabase.co',
  anonKey: 'sb_publishable_0V2wnrFWwlR_kST2zowBFw_j9kowZhx'
};

// Инициализация Supabase SDK
let supabaseClient = null;
try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Supabase Client успешно инициализирован');
  } else {
    console.warn('⚠️ Библиотека Supabase CDN еще не загружена');
  }
} catch (e) {
  console.error('Ошибка инициализации Supabase:', e);
}

// Пресеты стартовых пародийных видео для живой ленты
const INITIAL_SAMPLE_VIDEOS = [
  {
    id: 'sample-v1',
    user_id: 'user-catmaster',
    username: 'кот_борис_official',
    user_avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&h=150&fit=crop&crop=faces',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    caption: 'Когда хозяин открыл паштет в 3 часа ночи 🥩😹 #мем #котики #ночнойжор #тиктоп',
    music_title: 'Кошачья серенада (Remix 2026)',
    tags: '#мем #котики #ночнойжор #тиктоп',
    likes_count: 1420,
    comments_count: 53,
    shares_count: 128,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'sample-v2',
    user_id: 'user-puffahaka',
    username: 'puffahaka',
    user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    caption: '👑 Добро пожаловать в TikTop Parody! Я Главный Админ platform puffahaka. Тестируем тренды и лайки!',
    music_title: 'puffahaka - Official Admin Anthem ⚡',
    tags: '#admin #puffahaka #top #тренд',
    likes_count: 9999,
    comments_count: 320,
    shares_count: 880,
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'sample-v3',
    user_id: 'user-coder',
    username: 'senior_pomidor',
    user_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop&crop=faces',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    caption: 'Когда запушил код в пятницу в 18:00 и выключил телефон 🏃💨 #программист #itюмор #деплой',
    music_title: 'Run - AWOLNATION (Drop Beat)',
    tags: '#программист #itюмор #деплой',
    likes_count: 3410,
    comments_count: 89,
    shares_count: 240,
    created_at: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'sample-v4',
    user_id: 'user-nature',
    username: 'chill_vibes',
    user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    caption: 'Чилл тайм после тяжелого дня. Ставь лайк если тоже устал ✨🌴 #вайб #отдых #релакс',
    music_title: 'Lofi Sunset Chill Beats',
    tags: '#вайб #отдых #релакс',
    likes_count: 2150,
    comments_count: 42,
    shares_count: 110,
    created_at: new Date(Date.now() - 28800000).toISOString()
  }
];

/**
 * Сервис управления базой данных (Supabase с интеллектуальным fallback к локальному стораджу)
 */
class DatabaseService {
  constructor() {
    this.localKey = 'tiktop_local_db_v1';
    this.initLocalStore();
  }

  initLocalStore() {
    let store = localStorage.getItem(this.localKey);
    if (!store) {
      const initialDb = {
        users: [
          {
            id: 'user-puffahaka',
            username: 'puffahaka',
            password_hash: 'admin',
            display_name: 'Puffahaka (Создатель)',
            bio: '👑 Главный администратор TikTop Parody',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
            is_admin: true,
            is_banned: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'user-catmaster',
            username: 'кот_борис_official',
            password_hash: '123456',
            display_name: 'Кот Борис',
            bio: 'Мяу 🐾 Лучшие кошачьи приколы каждый день!',
            avatar_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&h=150&fit=crop&crop=faces',
            is_admin: false,
            is_banned: false,
            created_at: new Date().toISOString()
          }
        ],
        videos: INITIAL_SAMPLE_VIDEOS,
        likes: [],
        comments: [
          {
            id: 'c1',
            video_id: 'sample-v1',
            user_id: 'user-puffahaka',
            username: 'puffahaka',
            user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
            text: 'Шедевр! 😹',
            created_at: new Date().toISOString()
          }
        ],
        follows: [
          // Взаимная подписка для теста Друзей
          { id: 'f1', follower_id: 'user-puffahaka', following_id: 'user-catmaster', created_at: new Date().toISOString() },
          { id: 'f2', follower_id: 'user-catmaster', following_id: 'user-puffahaka', created_at: new Date().toISOString() }
        ],
        messages: []
      };
      localStorage.setItem(this.localKey, JSON.stringify(initialDb));
    }
  }

  getLocalDb() {
    return JSON.parse(localStorage.getItem(this.localKey) || '{}');
  }

  saveLocalDb(data) {
    localStorage.setItem(this.localKey, JSON.stringify(data));
  }

  // ================= USERS =================
  async getUserByUsername(username) {
    const cleanUsername = username.trim().toLowerCase();
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .ilike('username', cleanUsername)
          .maybeSingle();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase users query fallback:', e);
      }
    }
    const db = this.getLocalDb();
    return db.users?.find(u => u.username.toLowerCase() === cleanUsername) || null;
  }

  async getUserById(id) {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase getUserById fallback:', e);
      }
    }
    const db = this.getLocalDb();
    return db.users?.find(u => u.id === id) || null;
  }

  async createUser(userObj) {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .insert([userObj])
          .select()
          .single();
        if (!error && data) {
          // Sync with local
          const db = this.getLocalDb();
          db.users = db.users || [];
          db.users.push(data);
          this.saveLocalDb(db);
          return data;
        }
      } catch (e) {
        console.warn('Supabase createUser fallback:', e);
      }
    }
    const db = this.getLocalDb();
    db.users = db.users || [];
    db.users.push(userObj);
    this.saveLocalDb(db);
    return userObj;
  }

  async updateUser(id, fields) {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .update(fields)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          const db = this.getLocalDb();
          const idx = db.users?.findIndex(u => u.id === id);
          if (idx !== -1) {
            db.users[idx] = { ...db.users[idx], ...fields };
            this.saveLocalDb(db);
          }
          return data;
        }
      } catch (e) {
        console.warn('Supabase updateUser fallback:', e);
      }
    }
    const db = this.getLocalDb();
    const idx = db.users?.findIndex(u => u.id === id);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...fields };
      this.saveLocalDb(db);
      return db.users[idx];
    }
    return null;
  }

  async getAllUsers() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase getAllUsers fallback:', e);
      }
    }
    return this.getLocalDb().users || [];
  }

  // ================= VIDEOS =================
  async getVideos() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('videos')
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase getVideos fallback:', e);
      }
    }
    return (this.getLocalDb().videos || []).filter(v => !v.is_deleted);
  }

  async createVideo(videoObj) {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('videos')
          .insert([videoObj])
          .select()
          .single();
        if (!error && data) {
          const db = this.getLocalDb();
          db.videos = db.videos || [];
          db.videos.unshift(data);
          this.saveLocalDb(db);
          return data;
        }
      } catch (e) {
        console.warn('Supabase createVideo fallback:', e);
      }
    }
    const db = this.getLocalDb();
    db.videos = db.videos || [];
    db.videos.unshift(videoObj);
    this.saveLocalDb(db);
    return videoObj;
  }

  async deleteVideo(videoId) {
    if (supabaseClient) {
      try {
        await supabaseClient.from('videos').update({ is_deleted: true }).eq('id', videoId);
      } catch (e) {
        console.warn('Supabase deleteVideo fallback:', e);
      }
    }
    const db = this.getLocalDb();
    const vid = db.videos?.find(v => v.id === videoId);
    if (vid) {
      vid.is_deleted = true;
      this.saveLocalDb(db);
    }
    return true;
  }

  // ================= LIKES =================
  async isVideoLikedByUser(videoId, userId) {
    if (!userId) return false;
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('likes')
          .select('id')
          .eq('video_id', videoId)
          .eq('user_id', userId)
          .maybeSingle();
        if (!error && data) return true;
        if (!error && !data) return false;
      } catch (e) {
        console.warn('Supabase likes check fallback:', e);
      }
    }
    const db = this.getLocalDb();
    return !!db.likes?.some(l => l.video_id === videoId && l.user_id === userId);
  }

  async toggleLike(videoId, userId) {
    if (!userId) return false;
    const isLiked = await this.isVideoLikedByUser(videoId, userId);
    const db = this.getLocalDb();
    db.likes = db.likes || [];
    db.videos = db.videos || [];
    const video = db.videos.find(v => v.id === videoId);

    if (isLiked) {
      // Unlike
      if (supabaseClient) {
        try {
          await supabaseClient.from('likes').delete().eq('video_id', videoId).eq('user_id', userId);
          if (video && video.likes_count > 0) {
            await supabaseClient.from('videos').update({ likes_count: Math.max(0, (video.likes_count || 1) - 1) }).eq('id', videoId);
          }
        } catch (e) {}
      }
      db.likes = db.likes.filter(l => !(l.video_id === videoId && l.user_id === userId));
      if (video) video.likes_count = Math.max(0, (video.likes_count || 1) - 1);
      this.saveLocalDb(db);
      return false;
    } else {
      // Like
      const likeObj = {
        id: 'like-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        user_id: userId,
        video_id: videoId,
        created_at: new Date().toISOString()
      };
      if (supabaseClient) {
        try {
          await supabaseClient.from('likes').insert([likeObj]);
          if (video) {
            await supabaseClient.from('videos').update({ likes_count: (video.likes_count || 0) + 1 }).eq('id', videoId);
          }
        } catch (e) {}
      }
      db.likes.push(likeObj);
      if (video) video.likes_count = (video.likes_count || 0) + 1;
      this.saveLocalDb(db);
      return true;
    }
  }

  // ================= COMMENTS =================
  async getComments(videoId) {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('comments')
          .select('*')
          .eq('video_id', videoId)
          .order('created_at', { ascending: true });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase getComments fallback:', e);
      }
    }
    const db = this.getLocalDb();
    return (db.comments || []).filter(c => c.video_id === videoId);
  }

  async addComment(commentObj) {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('comments')
          .insert([commentObj])
          .select()
          .single();
        if (!error && data) {
          const db = this.getLocalDb();
          db.comments = db.comments || [];
          db.comments.push(data);
          const vid = db.videos?.find(v => v.id === commentObj.video_id);
          if (vid) vid.comments_count = (vid.comments_count || 0) + 1;
          this.saveLocalDb(db);
          return data;
        }
      } catch (e) {}
    }
    const db = this.getLocalDb();
    db.comments = db.comments || [];
    db.comments.push(commentObj);
    const vid = db.videos?.find(v => v.id === commentObj.video_id);
    if (vid) vid.comments_count = (vid.comments_count || 0) + 1;
    this.saveLocalDb(db);
    return commentObj;
  }

  async deleteComment(commentId) {
    if (supabaseClient) {
      try {
        await supabaseClient.from('comments').delete().eq('id', commentId);
      } catch (e) {}
    }
    const db = this.getLocalDb();
    db.comments = (db.comments || []).filter(c => c.id !== commentId);
    this.saveLocalDb(db);
    return true;
  }

  // ================= FOLLOWS & MUTUAL FRIENDS =================
  async isFollowing(followerId, followingId) {
    if (!followerId || !followingId) return false;
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('follows')
          .select('id')
          .eq('follower_id', followerId)
          .eq('following_id', followingId)
          .maybeSingle();
        if (!error && data) return true;
        if (!error && !data) return false;
      } catch (e) {}
    }
    const db = this.getLocalDb();
    return !!(db.follows || []).some(f => f.follower_id === followerId && f.following_id === followingId);
  }

  async areFriends(userA, userB) {
    if (!userA || !userB || userA === userB) return false;
    const aFollowsB = await this.isFollowing(userA, userB);
    const bFollowsA = await this.isFollowing(userB, userA);
    return aFollowsB && bFollowsA;
  }

  async toggleFollow(followerId, followingId) {
    if (!followerId || !followingId || followerId === followingId) return false;
    const alreadyFollowing = await this.isFollowing(followerId, followingId);
    const db = this.getLocalDb();
    db.follows = db.follows || [];

    if (alreadyFollowing) {
      if (supabaseClient) {
        try {
          await supabaseClient.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
        } catch (e) {}
      }
      db.follows = db.follows.filter(f => !(f.follower_id === followerId && f.following_id === followingId));
      this.saveLocalDb(db);
      return false;
    } else {
      const followObj = {
        id: 'f-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString()
      };
      if (supabaseClient) {
        try {
          await supabaseClient.from('follows').insert([followObj]);
        } catch (e) {}
      }
      db.follows.push(followObj);
      this.saveLocalDb(db);
      return true;
    }
  }

  async getMutualFriends(userId) {
    if (!userId) return [];
    const allUsers = await this.getAllUsers();
    const friends = [];
    for (const u of allUsers) {
      if (u.id !== userId) {
        const isFriend = await this.areFriends(userId, u.id);
        if (isFriend) {
          friends.push(u);
        }
      }
    }
    return friends;
  }

  async getFollowersCount(userId) {
    const db = this.getLocalDb();
    return (db.follows || []).filter(f => f.following_id === userId).length;
  }

  async getFollowingCount(userId) {
    const db = this.getLocalDb();
    return (db.follows || []).filter(f => f.follower_id === userId).length;
  }

  // ================= MESSAGES / SHARED VIDEOS =================
  async sendMessage(messageObj) {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('messages')
          .insert([messageObj])
          .select()
          .single();
        if (!error && data) {
          const db = this.getLocalDb();
          db.messages = db.messages || [];
          db.messages.push(data);
          this.saveLocalDb(db);
          return data;
        }
      } catch (e) {}
    }
    const db = this.getLocalDb();
    db.messages = db.messages || [];
    db.messages.push(messageObj);
    this.saveLocalDb(db);
    return messageObj;
  }

  async getUserMessages(userId) {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {}
    }
    const db = this.getLocalDb();
    return (db.messages || []).filter(m => m.sender_id === userId || m.receiver_id === userId);
  }

  // ================= ADMIN STATS =================
  async getSystemStats() {
    const users = await this.getAllUsers();
    const videos = await this.getVideos();
    const db = this.getLocalDb();
    const likesCount = (db.likes || []).length;
    const commentsCount = (db.comments || []).length;
    return {
      totalUsers: users.length,
      totalVideos: videos.length,
      totalLikes: likesCount,
      totalComments: commentsCount
    };
  }
}

window.dbService = new DatabaseService();
