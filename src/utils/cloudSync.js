import { initialChallengeLogs } from '../content/challengeData';
import initialThoughts from '../content/thoughts.json';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function getAuthHeader() {
  const isAuthor = localStorage.getItem('ink_author_mode') === 'true';
  const customKey = localStorage.getItem('ink_author_key') || 'gas';
  return isAuthor ? { 'Authorization': `Bearer ${customKey}` } : {};
}

export const cloudSync = {
  getApiBase() {
    return API_BASE;
  },

  isCloudConfigured() {
    return Boolean(API_BASE);
  },

  // ================= 21天打卡挑战 (Challenge Logs) =================
  async getChallengeLogs() {
    let local = [...initialChallengeLogs];
    try {
      const saved = localStorage.getItem('ink_challenge_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          local = parsed;
        }
      }
    } catch (e) {
      console.error('Failed reading local challenge logs:', e);
    }

    if (!API_BASE) return local;

    try {
      const res = await fetch(`${API_BASE}/api/challenge`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          // 智能双向非破坏性合并
          const map = new Map();
          local.forEach(log => {
            if (log && typeof log.day === 'number') {
              map.set(log.day, log);
            }
          });

          const remoteDaySet = new Set();
          data.logs.forEach(rLog => {
            if (rLog && typeof rLog.day === 'number') {
              remoteDaySet.add(rLog.day);
              map.set(rLog.day, rLog);
            }
          });

          // 如果本地有远程尚未同步的记录，且处于创作者模式，静默补传云端
          const isAuthor = localStorage.getItem('ink_author_mode') === 'true';
          if (isAuthor) {
            local.forEach(l => {
              if (l && typeof l.day === 'number' && !remoteDaySet.has(l.day)) {
                this.saveChallengeLog(l).catch(console.error);
              }
            });
          }

          const merged = Array.from(map.values()).sort((a, b) => a.day - b.day);
          localStorage.setItem('ink_challenge_logs', JSON.stringify(merged));
          return merged;
        }
      }
    } catch (err) {
      console.warn('Cloud sync: unable to fetch challenge logs, fallback to local', err);
    }
    return local;
  },

  async saveChallengeLog(newLog) {
    // 1. Optimistic Local Save
    let existing = [];
    try {
      existing = JSON.parse(localStorage.getItem('ink_challenge_logs') || '[]');
    } catch {
      existing = [...initialChallengeLogs];
    }
    const updated = [newLog, ...existing.filter(l => l.day !== newLog.day)].sort((a, b) => a.day - b.day);
    localStorage.setItem('ink_challenge_logs', JSON.stringify(updated));

    // 2. Cloud Save
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/api/challenge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify(newLog),
        });
      } catch (err) {
        console.error('Failed to sync new challenge log to cloud:', err);
      }
    }
    return updated;
  },

  async updateChallengeLog(day, updates) {
    // 1. Optimistic Local Update
    let existing = [];
    try {
      existing = JSON.parse(localStorage.getItem('ink_challenge_logs') || '[]');
    } catch {
      existing = [...initialChallengeLogs];
    }
    const updated = existing.map(l => (l.day === day ? { ...l, ...updates } : l));
    localStorage.setItem('ink_challenge_logs', JSON.stringify(updated));

    // 2. Cloud Update
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/api/challenge/${day}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify(updates),
        });
      } catch (err) {
        console.error('Failed to sync updated challenge log to cloud:', err);
      }
    }
    return updated;
  },

  async deleteChallengeLog(day) {
    // 1. Optimistic Local Delete
    let existing = [];
    try {
      existing = JSON.parse(localStorage.getItem('ink_challenge_logs') || '[]');
    } catch {
      existing = [...initialChallengeLogs];
    }
    const updated = existing.filter(l => l.day !== day);
    localStorage.setItem('ink_challenge_logs', JSON.stringify(updated));

    // 2. Cloud Delete
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/api/challenge/${day}`, {
          method: 'DELETE',
          headers: {
            ...getAuthHeader(),
          },
        });
      } catch (err) {
        console.error('Failed to delete challenge log on cloud:', err);
      }
    }
    return updated;
  },

  // ================= 灵感速记 (Thoughts Stream) =================
  async getThoughts() {
    let local = [...initialThoughts];
    try {
      const saved = localStorage.getItem('ink_user_thoughts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          local = parsed;
        }
      }
    } catch (e) {
      console.error('Failed reading local thoughts:', e);
    }

    if (!API_BASE) return local;

    try {
      const res = await fetch(`${API_BASE}/api/thoughts`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.thoughts)) {
          // 智能双向非破坏性合并
          const map = new Map();
          local.forEach(t => {
            if (t && t.id) map.set(t.id, t);
          });

          const remoteIdSet = new Set();
          data.thoughts.forEach(r => {
            if (r && r.id) {
              remoteIdSet.add(r.id);
              map.set(r.id, r);
            }
          });

          // 如果本地有尚未同步到云端的新速记，且处于作者模式，静默补传
          const isAuthor = localStorage.getItem('ink_author_mode') === 'true';
          if (isAuthor) {
            local.forEach(t => {
              if (t && t.id && !remoteIdSet.has(t.id)) {
                this.saveThought(t).catch(console.error);
              }
            });
          }

          const merged = Array.from(map.values()).sort((a, b) => {
            const dtA = `${a.date || ''} ${a.time || ''}`;
            const dtB = `${b.date || ''} ${b.time || ''}`;
            return dtB.localeCompare(dtA);
          });

          localStorage.setItem('ink_user_thoughts', JSON.stringify(merged));
          return merged;
        }
      }
    } catch (err) {
      console.warn('Cloud sync: unable to fetch thoughts, fallback to local', err);
    }
    return local;
  },

  async saveThought(thought) {
    let existing = [];
    try {
      existing = JSON.parse(localStorage.getItem('ink_user_thoughts') || '[]');
    } catch {
      existing = [...initialThoughts];
    }
    const updated = [thought, ...existing.filter(t => t.id !== thought.id)];
    localStorage.setItem('ink_user_thoughts', JSON.stringify(updated));

    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/api/thoughts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify(thought),
        });
      } catch (err) {
        console.error('Failed to sync thought to cloud:', err);
      }
    }
    return updated;
  },

  async updateThought(id, updates) {
    let existing = [];
    try {
      existing = JSON.parse(localStorage.getItem('ink_user_thoughts') || '[]');
    } catch {
      existing = [...initialThoughts];
    }
    const updated = existing.map(t => (t.id === id ? { ...t, ...updates } : t));
    localStorage.setItem('ink_user_thoughts', JSON.stringify(updated));

    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/api/thoughts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify(updates),
        });
      } catch (err) {
        console.error('Failed to sync thought update to cloud:', err);
      }
    }
    return updated;
  },

  async deleteThought(id) {
    let existing = [];
    try {
      existing = JSON.parse(localStorage.getItem('ink_user_thoughts') || '[]');
    } catch {
      existing = [...initialThoughts];
    }
    const updated = existing.filter(t => t.id !== id);
    localStorage.setItem('ink_user_thoughts', JSON.stringify(updated));

    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/api/thoughts/${id}`, {
          method: 'DELETE',
          headers: {
            ...getAuthHeader(),
          },
        });
      } catch (err) {
        console.error('Failed to delete thought on cloud:', err);
      }
    }
    return updated;
  },

  // ================= 点赞系统 (Target Likes) =================
  async getLikes() {
    let local = {};
    try {
      local = JSON.parse(localStorage.getItem('ink_thought_likes') || '{}');
    } catch {}

    if (!API_BASE) return local;

    try {
      const res = await fetch(`${API_BASE}/api/likes`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.likes && typeof data.likes === 'object') {
          const merged = { ...local, ...data.likes };
          localStorage.setItem('ink_thought_likes', JSON.stringify(merged));
          return merged;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote likes:', err);
    }
    return local;
  },

  async incrementLike(targetId) {
    let likes = {};
    try {
      likes = JSON.parse(localStorage.getItem('ink_thought_likes') || '{}');
    } catch {}
    const newCount = (likes[targetId] || 0) + 1;
    likes[targetId] = newCount;
    localStorage.setItem('ink_thought_likes', JSON.stringify(likes));

    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/api/likes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetId }),
        });
      } catch (err) {
        console.warn('Failed to sync like to cloud:', err);
      }
    }
    return likes;
  },
};
