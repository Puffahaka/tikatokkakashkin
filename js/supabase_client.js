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

/**
 * Сервис управления базой данных (Supabase с интеллектуальным fallback к локальному стораджу)
 */
class DatabaseService {
  constructor() {
    this.localKey = 'tiktop_db_v6';
    this.initLocalStore();
  }

  initLocalStore() {
    // Очищаем старые тестовые ключи с захардкоженным puffahaka
    ['tiktop_local_db_v1', 'tiktop_db_live_v3', 'tiktop_db_clean_v4', 'tiktop_db_clean_v5'].forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    let store = localStorage.getItem(this.localKey);
    if (!store) {
      const initialDb = {
        users: [], // Полностью чистый список: можно создать puffahaka или пуффахака без конфликтов!
        videos: [],
        likes: [],
        comments: [],
        follows: [],
        messages: []
      };
      localStorage.setItem(this.localKey, JSON.stringify(initialDb));
    }
  }

  getLocalDb() {
    try {
      const db = JSON.parse(localStorage.getItem(this.localKey) || '{}');
      // Удаляем любые остаточные тестовые профили
      if (db.users) {
        db.users = db.users.filter(u => u.id !== 'user-puffahaka' || u.password_hash !== 'admin');
      }
      return db;
    } catch (e) {
      return { users: [], videos: [], likes: [], comments: [], follows: [], messages: [] };
    }
  }

  saveLocalDb(data) {
    localStorage.setItem(this.localKey, JSON.stringify(data));
  }

  async withTimeout(promise, ms = 1200) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Timeout')), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
  }

  // ================= USERS =================
  async getUserByUsername(username) {
    const cleanUsername = username.trim().toLowerCase();
    if (supabaseClient) {
      try {
        const queryPromise = supabaseClient
          .from('users')
          .select('*')
          .ilike('username', cleanUsername)
          .maybeSingle();
        const { data, error } = await this.withTimeout(queryPromise, 1200);
        if (!error && data) return data;
      } catch (e) {
        // Fallback to local immediately
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
