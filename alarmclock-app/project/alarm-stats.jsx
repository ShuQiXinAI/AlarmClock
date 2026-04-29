// alarm-stats.jsx — StatsScreen

const StatsScreen = ({ onBack }) => {
  const weekData = [
    { day: '一', success: true, time: '07:02' },
    { day: '二', success: true, time: '07:05' },
    { day: '三', success: false, time: '--' },
    { day: '四', success: true, time: '07:01' },
    { day: '五', success: true, time: '06:58' },
    { day: '六', success: false, time: '--' },
    { day: '日', success: true, time: '09:15' },
  ];

  const achievements = [
    { emoji: '🏆', name: '卧薪尝胆', desc: '连续7天准时起床', unlocked: true },
    { emoji: '🎖️', name: '初出茅庐', desc: '第一次成功解锁闹钟', unlocked: true },
    { emoji: '☕', name: '早起的鸟儿', desc: '6点前起床一次', unlocked: true },
    { emoji: '🧮', name: '数学天才', desc: '答题正确率100%（连续10次）', unlocked: true },
    { emoji: '💪', name: '摇摇先生', desc: '累计摇晃10000次', unlocked: false },
    { emoji: '👁️', name: '千里眼', desc: '眨眼解锁累计50次', unlocked: false },
    { emoji: '🌟', name: '卷王之王', desc: '连续30天准时打卡', unlocked: false },
    { emoji: '😴', name: '起床困难户', desc: '连续失败3次（还要继续加油）', unlocked: false },
  ];

  const methodStats = [
    { label: '答题模式', emoji: '🧮', count: 48, color: COLORS.accent },
    { label: '眨眼模式', emoji: '👁️', count: 23, color: COLORS.primary },
    { label: '摇晃模式', emoji: '📳', count: 19, color: COLORS.danger },
  ];
  const totalMethods = methodStats.reduce((s, m) => s + m.count, 0);

  return (
    <div style={{ height: '100%', background: COLORS.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Nunito','Noto Sans SC',sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '12px 20px 10px', background: 'white', boxShadow: '0 1px 0 #ede8ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <BackButton onBack={onBack} />
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>📊 我的战绩</div>
          <div style={{ width: 52 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Top stats */}
        <div style={{ display: 'flex', gap: 9 }}>
          {[
            { label: '连续起床', value: '7', unit: '天', color: COLORS.primary, emoji: '🔥' },
            { label: '本月成功率', value: '71', unit: '%', color: COLORS.accent, emoji: '📈' },
            { label: '累计积分', value: '340', unit: 'pts', color: COLORS.warning, emoji: '⭐' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: 'white', borderRadius: 16, padding: '12px 8px',
              textAlign: 'center', boxShadow: `0 2px 12px ${s.color}20`,
              border: `1px solid ${s.color}25`,
            }}>
              <div style={{ fontSize: 20, marginBottom: 2 }}>{s.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                {s.value}<span style={{ fontSize: 12, fontWeight: 700 }}>{s.unit}</span>
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Weekly record */}
        <div style={{ background: 'white', borderRadius: 18, padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <SectionLabel>本周记录</SectionLabel>
          <div style={{ display: 'flex', gap: 5 }}>
            {weekData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700 }}>周{d.day}</div>
                <div style={{
                  width: '100%', aspectRatio: '1/1', borderRadius: 10,
                  background: d.success ? COLORS.successLight : COLORS.dangerLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: d.success ? COLORS.success : COLORS.danger, fontWeight: 800,
                }}>
                  {d.success ? '✓' : '✗'}
                </div>
                <div style={{ fontSize: 9, color: d.success ? COLORS.success : COLORS.textMuted, fontWeight: 700, textAlign: 'center' }}>
                  {d.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Method breakdown */}
        <div style={{ background: 'white', borderRadius: 18, padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <SectionLabel>解锁方式使用次数</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {methodStats.map(ms => (
              <div key={ms.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, width: 24 }}>{ms.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{ms.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: ms.color }}>{ms.count}次</span>
                  </div>
                  <div style={{ height: 7, background: COLORS.border, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${(ms.count / totalMethods) * 100}%`,
                      background: ms.color, borderRadius: 4,
                      transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: COLORS.textMuted, fontWeight: 600, textAlign: 'right' }}>
            共解锁 {totalMethods} 次 🎯
          </div>
        </div>

        {/* Achievements */}
        <div style={{ background: 'white', borderRadius: 18, padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <SectionLabel>🏅 成就系统</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {achievements.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 13,
                background: a.unlocked ? COLORS.primaryLight : '#f7f6ff',
                opacity: a.unlocked ? 1 : 0.55,
              }}>
                <div style={{ fontSize: 26, filter: a.unlocked ? 'none' : 'grayscale(1)', flexShrink: 0 }}>{a.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: a.unlocked ? COLORS.text : COLORS.textMuted }}>
                    {a.name}
                    {a.unlocked && <span style={{ fontSize: 11, color: COLORS.primary, marginLeft: 6, fontWeight: 700 }}>✓ 已解锁</span>}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>{a.desc}</div>
                </div>
                {!a.unlocked && <div style={{ fontSize: 15, flexShrink: 0 }}>🔒</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Funny bottom tagline */}
        <div style={{ textAlign: 'center', padding: '4px 0 12px', fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>
          😈 叫不醒你不罢休 · 你的专属起床折磨师
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { StatsScreen });
