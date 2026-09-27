import React, { useState } from 'react';
import {
  Flame,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Plus,
  Send,
  Clock,
  Compass,
  Lock,
  Star,
  ExternalLink,
  BookOpen,
  PenLine,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { initialChallengeConfig, initialChallengeLogs } from '../content/challengeData';

export default function ChallengeSection() {
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('ink_challenge_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If first item doesn't have ieltsTitle, migrate or merge with initial
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialChallengeLogs;
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState(logs[0] || null);
  const [editingDay, setEditingDay] = useState(null);
  const [editIeltsTitle, setEditIeltsTitle] = useState('');
  const [editIeltsNote, setEditIeltsNote] = useState('');
  const [editThoughtNote, setEditThoughtNote] = useState('');

  // Form states - separate inputs for separate tracks
  const [ieltsTitle, setIeltsTitle] = useState('');
  const [ieltsNote, setIeltsNote] = useState('');
  const [thoughtNote, setThoughtNote] = useState('');

  const completedDays = logs.length;
  const targetDays = initialChallengeConfig.targetDays;
  const progressPercent = Math.min(100, Math.round((completedDays / targetDays) * 100));

  // Calculate day difference from start
  const startDate = new Date(initialChallengeConfig.startDate);
  const today = new Date();
  const diffTime = Math.max(0, today - startDate);
  const currentDayInWindow = Math.min(initialChallengeConfig.windowDays, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

  // Grace days calculation
  const graceDaysUsed = Math.max(0, currentDayInWindow - completedDays);
  const graceDaysRemaining = Math.max(0, initialChallengeConfig.graceDaysTotal - graceDaysUsed);

  // Check if today is completed
  const todayStr = new Date().toISOString().split('T')[0];
  const isTodayCompleted = logs.some(l => l.date === todayStr);

  const handleAddLog = (e) => {
    e.preventDefault();
    if (!ieltsNote.trim()) {
      alert('请至少填写今天的【雅思实操卡点或招数】，作为每日及格保底！');
      return;
    }

    const nextDayNum = logs.length + 1;
    if (nextDayNum > targetDays) {
      alert('太棒了！21天挑战已经全量完成！');
      return;
    }

    const hasThought = !!thoughtNote.trim();
    const newLog = {
      day: nextDayNum,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      isDual: hasThought,
      type: hasThought ? '🌟 双轨双满贯' : '📘 雅思实操通关',
      title: ieltsTitle.trim() || `第 ${nextDayNum} 天卡点实录`,
      ieltsTitle: ieltsTitle.trim() || `第 ${nextDayNum} 天卡点实录`,
      ieltsNote: ieltsNote.trim(),
      thoughtNote: thoughtNote.trim() || '',
      note: hasThought
        ? `【雅思实操】${ieltsNote.trim()}\n【灵感速记】${thoughtNote.trim()}`
        : `【雅思实操】${ieltsNote.trim()}`,
    };

    // Auto-sync inspiration note to the blog's "Thoughts Stream"
    if (hasThought) {
      try {
        const existingThoughts = JSON.parse(localStorage.getItem('ink_user_thoughts') || '[]');
        const now = new Date();
        const syncedThought = {
          id: `t-chal-${Date.now()}`,
          date: now.toISOString().split('T')[0],
          time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          content: `【21天挑战·Day ${nextDayNum}】${thoughtNote.trim()}`,
          location: '21天打卡挑战',
        };
        localStorage.setItem('ink_user_thoughts', JSON.stringify([syncedThought, ...existingThoughts]));
      } catch (err) {
        console.error('Error syncing to thoughts stream:', err);
      }
    }

    const updated = [newLog, ...logs];
    setLogs(updated);
    setSelectedDayDetail(newLog);
    try {
      localStorage.setItem('ink_challenge_logs', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setIeltsTitle('');
    setIeltsNote('');
    setThoughtNote('');
    setShowForm(false);
  };

  const handleStartEditDay = (log) => {
    setEditingDay(log.day);
    setEditIeltsTitle(log.ieltsTitle || log.title || '');
    setEditIeltsNote(log.ieltsNote || log.note || '');
    setEditThoughtNote(log.thoughtNote || '');
  };

  const handleCancelEditDay = () => {
    setEditingDay(null);
    setEditIeltsTitle('');
    setEditIeltsNote('');
    setEditThoughtNote('');
  };

  const handleSaveEditDay = (e) => {
    e.preventDefault();
    if (!editIeltsNote.trim()) {
      alert('雅思实操内容不能为空！');
      return;
    }

    const hasThought = !!editThoughtNote.trim();
    const updated = logs.map(l => {
      if (l.day === editingDay) {
        return {
          ...l,
          isDual: hasThought,
          type: hasThought ? '🌟 双轨双满贯' : '📘 雅思实操通关',
          title: editIeltsTitle.trim() || ('第 ' + l.day + ' 天卡点实录'),
          ieltsTitle: editIeltsTitle.trim() || ('第 ' + l.day + ' 天卡点实录'),
          ieltsNote: editIeltsNote.trim(),
          thoughtNote: editThoughtNote.trim() || '',
          note: hasThought
            ? '【雅思实操】' + editIeltsNote.trim() + '\n【灵感速记】' + editThoughtNote.trim()
            : '【雅思实操】' + editIeltsNote.trim(),
        };
      }
      return l;
    });

    setLogs(updated);
    const updatedDetail = updated.find(l => l.day === editingDay);
    if (updatedDetail) setSelectedDayDetail(updatedDetail);
    localStorage.setItem('ink_challenge_logs', JSON.stringify(updated));

    if (hasThought) {
      try {
        const existingThoughts = JSON.parse(localStorage.getItem('ink_user_thoughts') || '[]');
        const updatedThoughts = [
          {
            id: 't-edit-' + Date.now(),
            date: updatedDetail.date,
            time: '刚刚',
            content: '【21天挑战·Day ' + editingDay + '】' + editThoughtNote.trim(),
            location: '21天打卡挑战 (已更新)',
          },
          ...existingThoughts.filter(t => !t.content.includes('【21天挑战·Day ' + editingDay + '】'))
        ];
        localStorage.setItem('ink_user_thoughts', JSON.stringify(updatedThoughts));
      } catch (err) {
        console.error(err);
      }
    }

    setEditingDay(null);
  };

  const handleDeleteDay = (dayNum) => {
    if (confirm('确认删除 Day ' + dayNum + ' 的打卡记录吗？删除后可重新交卷。')) {
      const updated = logs.filter(l => l.day !== dayNum);
      setLogs(updated);
      localStorage.setItem('ink_challenge_logs', JSON.stringify(updated));
      if (selectedDayDetail && selectedDayDetail.day === dayNum) {
        setSelectedDayDetail(updated[0] || null);
      }
      if (editingDay === dayNum) setEditingDay(null);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('确认重置为官方第一天初始打卡记录吗？')) {
      localStorage.removeItem('ink_challenge_logs');
      setLogs(initialChallengeLogs);
      setSelectedDayDetail(initialChallengeLogs[0]);
    }
  };

  // Build 21 slots
  const slots = Array.from({ length: 21 }, (_, i) => {
    const dayNum = i + 1;
    const log = logs.find(l => l.day === dayNum);
    if (log) {
      return { dayNum, status: 'completed', log };
    }
    if (dayNum === logs.length + 1) {
      return { dayNum, status: 'current' };
    }
    return { dayNum, status: 'locked' };
  });

  return (
    <section className="challenge-page animate-fade-in">
      {/* Hero Header */}
      <div className="section-intro">
        <div className="section-title-wrap">
          <span className="section-pretitle">PUBLIC PLEDGE · 公开挑战与誓约</span>
          <h1 className="section-title">21天 AI 雅思备战与灵感挑战</h1>
        </div>
        <p className="section-desc">
          在新时代，一个不报班、不请外教的普通人，纯靠 AI 能在短期内把雅思学到什么水平？
          <strong> 每日双轨独立打卡：① 📘 雅思实操卡点（核心保底）+ ② ✨ 灵感速记（思维加分项）。</strong>
          30 天内有效打卡满 21 天即宣告通关！预设 9 天免死休整期，绝不搞一票否决的完美主义。
        </p>
      </div>

      {/* Metrics Dashboard */}
      <div className="challenge-metrics-grid">
        <div className="challenge-metric-card">
          <div className="metric-header">
            <span className="metric-label">通关进度</span>
            <Trophy size={16} className="metric-icon accent" />
          </div>
          <div className="metric-value">
            <span className="number">{completedDays}</span>
            <span className="total">/ {targetDays} 天</span>
          </div>
          <div className="metric-sub">{progressPercent}% 已达成</div>
        </div>

        <div className="challenge-metric-card">
          <div className="metric-header">
            <span className="metric-label">当前窗口期</span>
            <Calendar size={16} className="metric-icon" />
          </div>
          <div className="metric-value">
            <span className="number">第 {currentDayInWindow}</span>
            <span className="total">/ {initialChallengeConfig.windowDays} 天</span>
          </div>
          <div className="metric-sub">倒计时阶段中</div>
        </div>

        <div className="challenge-metric-card">
          <div className="metric-header">
            <span className="metric-label">剩余免死金牌</span>
            <ShieldCheck size={16} className="metric-icon success" />
          </div>
          <div className="metric-value">
            <span className="number">{graceDaysRemaining}</span>
            <span className="total">/ {initialChallengeConfig.graceDaysTotal} 天</span>
          </div>
          <div className="metric-sub">弹性容错，拒绝内耗</div>
        </div>

        <div className="challenge-metric-card">
          <div className="metric-header">
            <span className="metric-label">今日交卷状态</span>
            <Flame size={16} className={`metric-icon ${isTodayCompleted ? 'accent' : ''}`} />
          </div>
          <div className="metric-value status-val">
            {isTodayCompleted ? (
              <span className="status-badge success">✅ 今日已交卷</span>
            ) : (
              <span className="status-badge pending">⏳ 等待今日交卷</span>
            )}
          </div>
          <div className="metric-sub">
            {isTodayCompleted ? '今日任务稳稳达成' : '雅思实操 + 灵感速记'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="challenge-progress-bar-card">
        <div className="progress-bar-header">
          <span>21天冲刺里程碑</span>
          <span>{progressPercent}% 完成</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="milestones-row">
          <span className={completedDays >= 7 ? 'active' : ''}>🌱 Day 7（起跑破冰）</span>
          <span className={completedDays >= 14 ? 'active' : ''}>🔥 Day 14（肌肉记忆）</span>
          <span className={completedDays >= 21 ? 'active' : ''}>🏆 Day 21（全胜通关）</span>
        </div>
      </div>

      {/* Ground Rules & Mindset */}
      <div className="challenge-rules-card">
        <div className="rules-header">
          <Compass size={18} className="rules-icon" />
          <h3>双轨打卡规则与容错契约</h3>
        </div>
        <div className="rules-grid">
          <div className="rule-item">
            <span className="rule-badge">01</span>
            <div>
              <strong>📘 雅思实操（每日核心及格线）</strong>
              <p>每天至少 1 条当天真实做题卡点或试出的 AI 提分招数。完成此项即判定 100 分通关！</p>
            </div>
          </div>
          <div className="rule-item">
            <span className="rule-badge">02</span>
            <div>
              <strong>✨ 灵感速记（思维双满贯）</strong>
              <p>每天至少 1 条思想闪念或读书金句，填写后自动同步至全站「速记流」，点亮双满贯徽章！</p>
            </div>
          </div>
          <div className="rule-item">
            <span className="rule-badge">03</span>
            <div>
              <strong>🛡️ 预设 9 天免死容错</strong>
              <p>30 天周期内累计达成 21 天就算胜利。生病、加班随便休，绝不因为断更一天而内耗放弃。</p>
            </div>
          </div>
        </div>
      </div>

      {/* 21 Stamps Grid */}
      <div className="stamps-section">
        <div className="stamps-header">
          <div>
            <h2 className="stamps-title">21 格打卡印章墙</h2>
            <p className="stamps-desc">点击已盖章卡片即可在下方查看当天的双轨实操与速记证词</p>
          </div>
          <div className="header-actions-group">
            <button
              className="action-stamp-btn"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus size={15} />
              <span>{showForm ? '收起打卡面板' : '记今日打卡 (双轨独立)'}</span>
            </button>
          </div>
        </div>

        {/* Dual Input Form */}
        {showForm && (
          <form className="challenge-form animate-fade-in" onSubmit={handleAddLog}>
            <div className="form-legend">
              <Sparkles size={16} className="legend-icon" />
              <span>今日双轨打卡表单（两轨内容独立输入、互不冲突）</span>
            </div>

            <div className="dual-form-grid">
              {/* Track 1: IELTS */}
              <div className="dual-input-block ielts-track">
                <div className="track-title-row">
                  <span className="track-badge ielts">📘 项目一：雅思实操（必填 · 核心保底）</span>
                </div>
                <input
                  type="text"
                  placeholder="卡点/招数简称（例：背单词看例句太耗时卡点）"
                  value={ieltsTitle}
                  onChange={e => setIeltsTitle(e.target.value)}
                  className="challenge-input"
                  required
                />
                <textarea
                  placeholder="记录今天真实发生的做题卡点，或试出的 AI 提分招数（1~2 句话即可交卷）..."
                  value={ieltsNote}
                  onChange={e => setIeltsNote(e.target.value)}
                  rows={4}
                  required
                  className="challenge-textarea"
                />
              </div>

              {/* Track 2: Thought */}
              <div className="dual-input-block thought-track">
                <div className="track-title-row">
                  <span className="track-badge thought">✨ 项目二：灵感速记（选填 · 思维双满贯）</span>
                  <span className="auto-sync-tag">⚡ 自动同步全站「速记」</span>
                </div>
                <textarea
                  placeholder="记录今天思想的闪念、读书顿悟或人生反思（选填，填了直接点亮 🌟 双满贯金印，并自动进入博客速记流）..."
                  value={thoughtNote}
                  onChange={e => setThoughtNote(e.target.value)}
                  rows={6}
                  className="challenge-textarea"
                />
              </div>
            </div>

            <div className="form-submit-footer">
              <div className="form-submit-hint">
                {thoughtNote.trim() ? (
                  <span className="hint-pill dual">🌟 已填写双轨内容，提交将点亮【双轨双满贯】！</span>
                ) : (
                  <span className="hint-pill single">✅ 已填写雅思实操，提交即可保底 100 分通关！</span>
                )}
              </div>
              <button type="submit" className="submit-challenge-btn">
                <Send size={14} />
                <span>立即交卷盖章 (Day {completedDays + 1})</span>
              </button>
            </div>
          </form>
        )}

        {/* 21 Stamps Grid */}
        <div className="stamps-grid">
          {slots.map(({ dayNum, status, log }) => (
            <div
              key={dayNum}
              className={`stamp-card ${status} ${selectedDayDetail?.day === dayNum ? 'selected' : ''}`}
              onClick={() => log && setSelectedDayDetail(log)}
            >
              <div className="stamp-top">
                <span className="stamp-day-num">Day {String(dayNum).padStart(2, '0')}</span>
                {status === 'completed' && (
                  log?.isDual ? (
                    <Star size={15} className="stamp-star-icon" title="双轨双满贯" />
                  ) : (
                    <CheckCircle2 size={15} className="stamp-check-icon" title="雅思通关" />
                  )
                )}
                {status === 'current' && <Flame size={15} className="stamp-fire-icon" />}
                {status === 'locked' && <Lock size={13} className="stamp-lock-icon" />}
              </div>

              <div className="stamp-body">
                {status === 'completed' ? (
                  <>
                    <div className={`stamp-badge-stamped ${log?.isDual ? 'dual' : ''}`}>
                      {log?.isDual ? '🌟 双满贯' : '✅ PASSED'}
                    </div>
                    <div className="stamp-title-text" title={log?.ieltsTitle || log?.title}>
                      {log?.ieltsTitle || log?.title}
                    </div>
                  </>
                ) : status === 'current' ? (
                  <div className="stamp-current-text">
                    <span>今日待战</span>
                  </div>
                ) : (
                  <div className="stamp-locked-text">
                    <span>待解锁</span>
                  </div>
                )}
              </div>

              {log && (
                <div className="stamp-date-footer">
                  <span>{log.date.slice(5)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Log Detail Card */}
      {selectedDayDetail && (
        <div className="day-detail-card animate-fade-in">
          {editingDay === selectedDayDetail.day ? (
            /* Editing Form for this day */
            <form className="edit-day-form animate-fade-in" onSubmit={handleSaveEditDay}>
              <div className="edit-form-header">
                <span className="edit-form-title">✏️ 编辑 Day {selectedDayDetail.day} 打卡记录</span>
                <span className="edit-form-date">打卡日期：{selectedDayDetail.date}</span>
              </div>

              <div className="dual-form-grid">
                <div className="dual-input-block ielts-track">
                  <span className="track-badge ielts">📘 雅思实操（必填）</span>
                  <input
                    type="text"
                    placeholder="卡点/招数简称"
                    value={editIeltsTitle}
                    onChange={e => setEditIeltsTitle(e.target.value)}
                    className="challenge-input"
                    required
                  />
                  <textarea
                    placeholder="雅思实操做题卡点或AI招数..."
                    value={editIeltsNote}
                    onChange={e => setEditIeltsNote(e.target.value)}
                    rows={4}
                    required
                    className="challenge-textarea"
                  />
                </div>

                <div className="dual-input-block thought-track">
                  <span className="track-badge thought">✨ 灵感速记（选填）</span>
                  <textarea
                    placeholder="思想闪念、顿悟金句..."
                    value={editThoughtNote}
                    onChange={e => setEditThoughtNote(e.target.value)}
                    rows={6}
                    className="challenge-textarea"
                  />
                </div>
              </div>

              <div className="edit-actions-bar">
                <button type="button" className="btn-cancel-edit" onClick={handleCancelEditDay}>
                  <X size={14} /> <span>取消</span>
                </button>
                <button type="submit" className="btn-save-edit">
                  <Check size={14} /> <span>保存修改</span>
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <>
              <div className="detail-header">
                <div>
                  <div className="detail-badges-row">
                    <span className="detail-badge-day">Day {String(selectedDayDetail.day).padStart(2, '0')} 详细打卡证据档案</span>
                    {selectedDayDetail.isDual ? (
                      <span className="detail-tag-dual">🌟 双轨双满贯（实操 + 速记全部达成）</span>
                    ) : (
                      <span className="detail-tag-single">📘 雅思实操通关（已达成核心及格线）</span>
                    )}
                  </div>
                  <h3 className="detail-title">{selectedDayDetail.ieltsTitle || selectedDayDetail.title}</h3>
                </div>
                <div className="detail-actions-right">
                  <div className="detail-date-tag">
                    <Clock size={12} />
                    <span>{selectedDayDetail.date}</span>
                  </div>
                  <div className="log-manage-btn-group">
                    <button
                      className="log-manage-btn edit"
                      onClick={() => handleStartEditDay(selectedDayDetail)}
                      title="编辑修改打卡"
                    >
                      <PenLine size={13} />
                      <span>编辑</span>
                    </button>
                    <button
                      className="log-manage-btn delete"
                      onClick={() => handleDeleteDay(selectedDayDetail.day)}
                      title="删除此天打卡"
                    >
                      <Trash2 size={13} />
                      <span>删除</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="detail-tracks-container">
                {/* Track 1 Detail */}
                <div className="detail-track-box ielts">
                  <div className="track-box-header">
                    <span className="track-icon">📘</span>
                    <h4>雅思实操卡点与招数</h4>
                  </div>
                  <p className="track-content-text">
                    {selectedDayDetail.ieltsNote || selectedDayDetail.note}
                  </p>
                </div>

                {/* Track 2 Detail */}
                {selectedDayDetail.thoughtNote && (
                  <div className="detail-track-box thought">
                    <div className="track-box-header">
                      <span className="track-icon">✨</span>
                      <h4>灵感速记与顿悟</h4>
                      <span className="synced-badge">⚡ 已同步全站速记流</span>
                    </div>
                    <p className="track-content-text">
                      {selectedDayDetail.thoughtNote}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Daily Logs Timeline */}
      <div className="logs-timeline-section">
        <div className="timeline-header-row">
          <h2 className="timeline-title">打卡历程日志 (Action Feed)</h2>
          <button className="reset-log-link" onClick={handleResetToDefault} title="若打卡异常可重置为初始数据">
            🔄 同步官方初始数据
          </button>
        </div>

        <div className="challenge-logs-list">
          {logs.map(log => (
            <article key={log.day} className="challenge-log-item animate-fade-in">
              <div className="log-day-col">
                <span className="log-day-tag">Day {String(log.day).padStart(2, '0')}</span>
                <span className="log-date">{log.date}</span>
              </div>
              <div className="log-main-col">
                <div className="log-type-tag-row">
                  {log.isDual ? (
                    <span className="log-type-tag dual">🌟 双轨双满贯</span>
                  ) : (
                    <span className="log-type-tag ielts">📘 雅思实操</span>
                  )}
                </div>
                <div className="timeline-title-row">
                  <h4 className="log-heading">{log.ieltsTitle || log.title}</h4>
                  <div className="timeline-action-buttons">
                    <button
                      className="mini-log-btn edit"
                      onClick={() => {
                        setSelectedDayDetail(log);
                        handleStartEditDay(log);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      title="编辑"
                    >
                      <PenLine size={12} />
                      <span>编辑</span>
                    </button>
                    <button
                      className="mini-log-btn delete"
                      onClick={() => handleDeleteDay(log.day)}
                      title="删除"
                    >
                      <Trash2 size={12} />
                      <span>删除</span>
                    </button>
                  </div>
                </div>
                <div className="log-sub-content">
                  <p className="log-section-p">
                    <strong>📘 雅思实操：</strong>
                    {log.ieltsNote || log.note}
                  </p>
                  {log.thoughtNote && (
                    <p className="log-section-p thought-p">
                      <strong>✨ 灵感速记：</strong>
                      {log.thoughtNote}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
