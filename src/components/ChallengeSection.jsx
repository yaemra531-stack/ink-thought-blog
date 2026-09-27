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
  Zap,
  Lock,
  ChevronRight
} from 'lucide-react';
import { initialChallengeConfig, initialChallengeLogs } from '../content/challengeData';

export default function ChallengeSection() {
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('ink_challenge_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialChallengeLogs;
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  // Form states
  const [logType, setLogType] = useState('📘 雅思实操 (卡点/招数)');
  const [logTitle, setLogTitle] = useState('');
  const [logNote, setLogNote] = useState('');

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
    if (!logNote.trim()) return;

    const nextDayNum = logs.length + 1;
    if (nextDayNum > targetDays) {
      alert('太棒了！21天挑战已经全量完成！');
      return;
    }

    const newLog = {
      day: nextDayNum,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      type: logType,
      title: logTitle.trim() || `第 ${nextDayNum} 天打卡实录`,
      note: logNote.trim(),
    };

    const updated = [newLog, ...logs];
    setLogs(updated);
    try {
      localStorage.setItem('ink_challenge_logs', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setLogTitle('');
    setLogNote('');
    setShowForm(false);
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
          <strong>每日双轨推进：① 📘 雅思实操（1条卡点或招数）；② ✨ 灵感速记（1条思想闪念）。</strong>
          30 天内有效打卡满 21 天即宣告通关，预设 9 天免死休整期，绝不搞一票否决的完美主义！
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
            {isTodayCompleted ? '今日双轨已稳稳打卡' : '雅思实操 + 灵感速记'}
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
          <h3>挑战核心打卡清单与容错契约</h3>
        </div>
        <div className="rules-grid">
          <div className="rule-item">
            <span className="rule-badge">01</span>
            <div>
              <strong>📘 雅思实操（每日核心及格线）</strong>
              <p>每天至少 1 条真实发生的做题卡点或试出的 AI 提分招数（配 1~2 句大白话或截图）。完成此项即 100 分通关！</p>
            </div>
          </div>
          <div className="rule-item">
            <span className="rule-badge">02</span>
            <div>
              <strong>✨ 灵感速记（思维双满贯）</strong>
              <p>每天至少 1 条思想闪念、读书金句或生活顿悟。两项加起来不到 100 字，耗时 5 分钟以内。</p>
            </div>
          </div>
          <div className="rule-item">
            <span className="rule-badge">03</span>
            <div>
              <strong>🛡️ 预设 9 天免死容错</strong>
              <p>30 天周期内累计满 21 天就算大胜。加班生病随便休，彻底消除断更内耗！</p>
            </div>
          </div>
        </div>
      </div>

      {/* 21 Stamps Grid */}
      <div className="stamps-section">
        <div className="stamps-header">
          <div>
            <h2 className="stamps-title">21 格打卡印章墙</h2>
            <p className="stamps-desc">点击已盖章卡片可查看当天具体的卡点或小发现记录</p>
          </div>
          <button
            className="action-stamp-btn"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={15} />
            <span>{showForm ? '收起打卡' : '记今日打卡'}</span>
          </button>
        </div>

        {/* Quick Log Form */}
        {showForm && (
          <form className="challenge-form animate-fade-in" onSubmit={handleAddLog}>
            <div className="form-row-type">
              <label>打卡类型：</label>
              <div className="type-buttons">
                <button
                  type="button"
                  className={`type-btn ${logType === '📘 雅思实操 (卡点/招数)' ? 'active' : ''}`}
                  onClick={() => setLogType('📘 雅思实操 (卡点/招数)')}
                >
                  📘 雅思实操 (卡点/招数)
                </button>
                <button
                  type="button"
                  className={`type-btn ${logType === '✨ 灵感速记 (闪念/顿悟)' ? 'active' : ''}`}
                  onClick={() => setLogType('✨ 灵感速记 (闪念/顿悟)')}
                >
                  ✨ 灵感速记 (闪念/顿悟)
                </button>
                <button
                  type="button"
                  className={`type-btn ${logType === '🌟 双轨双卡 (雅思+速记)' ? 'active' : ''}`}
                  onClick={() => setLogType('🌟 双轨双卡 (雅思+速记)')}
                >
                  🌟 双轨双卡 (雅思+速记)
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="今日标题（例如：把难词4个一组让AI生图）"
              value={logTitle}
              onChange={e => setLogTitle(e.target.value)}
              className="challenge-input"
            />

            <textarea
              placeholder="记录今天真实发生的卡点或小招数（1~2 句话大白话即可交卷）..."
              value={logNote}
              onChange={e => setLogNote(e.target.value)}
              rows={3}
              required
              className="challenge-textarea"
            />

            <div className="form-actions-right">
              <button type="submit" className="submit-challenge-btn">
                <Send size={14} />
                <span>立即交卷盖章 (Day {completedDays + 1})</span>
              </button>
            </div>
          </form>
        )}

        <div className="stamps-grid">
          {slots.map(({ dayNum, status, log }) => (
            <div
              key={dayNum}
              className={`stamp-card ${status} ${selectedDayDetail?.day === dayNum ? 'selected' : ''}`}
              onClick={() => log && setSelectedDayDetail(log)}
            >
              <div className="stamp-top">
                <span className="stamp-day-num">Day {String(dayNum).padStart(2, '0')}</span>
                {status === 'completed' && <CheckCircle2 size={16} className="stamp-check-icon" />}
                {status === 'current' && <Flame size={16} className="stamp-fire-icon" />}
                {status === 'locked' && <Lock size={14} className="stamp-lock-icon" />}
              </div>

              <div className="stamp-body">
                {status === 'completed' ? (
                  <>
                    <div className="stamp-badge-stamped">PASSED</div>
                    <div className="stamp-title-text" title={log?.title}>
                      {log?.title}
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

      {/* Selected Day Log Detail Popover / Card */}
      {selectedDayDetail && (
        <div className="day-detail-card animate-fade-in">
          <div className="detail-header">
            <div>
              <span className="detail-badge">Day {String(selectedDayDetail.day).padStart(2, '0')} · {selectedDayDetail.type}</span>
              <h3 className="detail-title">{selectedDayDetail.title}</h3>
            </div>
            <button className="close-detail-btn" onClick={() => setSelectedDayDetail(null)}>
              ✕
            </button>
          </div>
          <div className="detail-date">
            <Clock size={12} />
            <span>打卡日期：{selectedDayDetail.date}</span>
          </div>
          <p className="detail-note">{selectedDayDetail.note}</p>
        </div>
      )}

      {/* Daily Logs Timeline */}
      <div className="logs-timeline-section">
        <h2 className="timeline-title">打卡历程日志 (Action Feed)</h2>
        <div className="challenge-logs-list">
          {logs.map(log => (
            <article key={log.day} className="challenge-log-item animate-fade-in">
              <div className="log-day-col">
                <span className="log-day-tag">Day {String(log.day).padStart(2, '0')}</span>
                <span className="log-date">{log.date}</span>
              </div>
              <div className="log-main-col">
                <div className="log-type-tag">{log.type}</div>
                <h4 className="log-heading">{log.title}</h4>
                <p className="log-text">{log.note}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
