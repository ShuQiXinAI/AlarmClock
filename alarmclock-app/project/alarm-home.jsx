// alarm-home.jsx — HomeScreen + EditAlarmScreen

const DEFAULT_ALARMS = [
  { id: 1, time: '07:00', label: '上班打卡', method: 'math', active: true },
  { id: 2, time: '07:30', label: '再不起来就迟到了！', method: 'blink', active: true },
  { id: 3, time: '08:00', label: '⚠️ 最后警告', method: 'shake', active: false },
  { id: 4, time: '06:30', label: '早起鸟儿有虫吃', method: 'math', active: false },
];

const HomeScreen = ({ alarms, setAlarms, onEdit, onSimulateRing, onStats }) => {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleAlarm = (id) => setAlarms(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  const activeCount = alarms.filter(a => a.active).length;
  const days = ['日','一','二','三','四','五','六'];
  const todayStr = `${now.getMonth()+1}月${now.getDate()}日 周${days[now.getDay()]}`;
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const motivations = ['今天也要元气满满！💪', '打工人，冲！', '床是你的敌人！🛏️', '离发薪日又近一天！'];
  const motto = motivations[now.getDay() % motivations.length];

  return (
    <div style={{ height: '100%', background: COLORS.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Nunito','Noto Sans SC',sans-serif", overflow: 'hidden' }}>
      {/* Hero Header */}
      <div style={{
        background: `linear-gradient(145deg, oklch(0.22 0.22 272) 0%, oklch(0.38 0.30 285) 55%, oklch(0.52 0.28 310) 100%)`,
        padding: '14px 20px 20px', color: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, letterSpacing: '0.05em' }}>叫不醒你不罢休 ⏰</div>
            <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, marginTop: 2 }}>{timeStr}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4, fontWeight: 600 }}>{todayStr} · {activeCount} 个闹钟已开启</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={onStats} style={{
              background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 12,
              width: 36, height: 36, cursor: 'pointer', fontSize: 17,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>📊</button>
          </div>
        </div>
        <div style={{
          marginTop: 12, background: 'rgba(255,255,255,0.14)', borderRadius: 10,
          padding: '8px 12px', fontSize: 12, fontWeight: 600, opacity: 0.9,
        }}>
          😈 {motto}
        </div>
      </div>

      {/* Alarm List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionLabel>我的闹钟</SectionLabel>
        {alarms.map(alarm => {
          const m = DISMISS_METHODS[alarm.method];
          return (
            <div key={alarm.id}
              onClick={() => onSimulateRing(alarm)}
              style={{
                background: 'white', borderRadius: 18, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: alarm.active ? `0 2px 16px ${m.color}28` : '0 1px 6px rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${alarm.active ? m.color : '#e0daf5'}`,
                opacity: alarm.active ? 1 : 0.65, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: alarm.active ? COLORS.text : COLORS.textMuted, letterSpacing: '-1px', lineHeight: 1 }}>
                  {alarm.time}
                </div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 3, fontWeight: 600 }}>{alarm.label}</div>
                <div style={{ marginTop: 6 }}><DismissBadge method={alarm.method} small /></div>
              </div>
              <div onClick={e => { e.stopPropagation(); toggleAlarm(alarm.id); }}>
                <ToggleSwitch value={alarm.active} onChange={() => toggleAlarm(alarm.id)} />
              </div>
            </div>
          );
        })}
        <div style={{ textAlign: 'center', padding: '8px 0 20px', color: COLORS.textMuted, fontSize: 11, fontWeight: 600 }}>
          点击任意闹钟可模拟响铃体验 👆
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => onEdit(null)} style={{
        position: 'absolute', bottom: 82, right: 20,
        width: 52, height: 52, borderRadius: '50%',
        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
        border: 'none', cursor: 'pointer',
        boxShadow: `0 4px 18px ${COLORS.primary}60`,
        fontSize: 26, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.15s',
      }}>+</button>

      {/* Tab Bar */}
      <div style={{ background: 'white', borderTop: '1px solid #ede8ff', display: 'flex', padding: '8px 0 22px' }}>
        {[['⏰','闹钟',true],['📊','统计',false]].map(([icon, label, active]) => (
          <div key={label} onClick={label === '统计' ? onStats : undefined} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            cursor: label === '统计' ? 'pointer' : 'default',
          }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ fontSize: 10, color: active ? COLORS.primary : COLORS.textMuted, fontWeight: 700 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const EditAlarmScreen = ({ alarm, onSave, onBack }) => {
  const [hour, setHour] = React.useState(alarm ? parseInt(alarm.time.split(':')[0]) : 7);
  const [minute, setMinute] = React.useState(alarm ? parseInt(alarm.time.split(':')[1]) : 0);
  const [label, setLabel] = React.useState(alarm ? alarm.label : '');
  const [method, setMethod] = React.useState(alarm ? alarm.method : 'math');

  const timeStr = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;

  const methodCards = [
    { key: 'math', emoji: '🧮', title: '答题模式', desc: '做对数学题才能解脱\n"睡眼惺忪还要算术？"', color: COLORS.accent },
    { key: 'blink', emoji: '👁️', title: '眨眼模式', desc: '对准摄像头眨眼3次\n"证明你的眼睛没粘上"', color: COLORS.primary },
    { key: 'shake', emoji: '📳', title: '摇晃模式', desc: '使劲摇手机才能关闭\n"把懒虫统统摇出去！"', color: COLORS.danger },
  ];

  const btnStyle = {
    background: COLORS.primaryLight, border: 'none', borderRadius: 10,
    width: 48, height: 32, cursor: 'pointer', fontSize: 16,
    color: COLORS.primary, fontWeight: 800, fontFamily: 'inherit',
  };

  return (
    <div style={{ height: '100%', background: COLORS.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Nunito','Noto Sans SC',sans-serif" }}>
      <div style={{ padding: '12px 20px 10px', background: 'white', boxShadow: '0 1px 0 #ede8ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <BackButton onBack={onBack} />
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>{alarm ? '编辑闹钟' : '新建闹钟'}</div>
          <button onClick={() => onSave({ id: alarm ? alarm.id : Date.now(), time: timeStr, label: label || '新闹钟', method, active: true })} style={{
            background: COLORS.primary, color: 'white', border: 'none',
            borderRadius: 10, padding: '6px 14px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>保存</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Time picker */}
        <div style={{ background: 'white', borderRadius: 20, padding: '18px 20px', marginBottom: 12, boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign: 'center', fontSize: 64, fontWeight: 900, color: COLORS.text, letterSpacing: '-3px', lineHeight: 1 }}>
            {timeStr}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            {[['时', hour, setHour, 24], ['分', minute, setMinute, 60, 5]].map(([unit, val, setter, max, step=1]) => (
              <div key={unit} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <button onClick={() => setter(v => (v - step + max) % max)} style={btnStyle}>▼</button>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMuted, width: 20, textAlign: 'center' }}>{unit}</div>
                <button onClick={() => setter(v => (v + step) % max)} style={btnStyle}>▲</button>
              </div>
            ))}
          </div>
        </div>

        {/* Label */}
        <div style={{ background: 'white', borderRadius: 16, padding: '14px 16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <SectionLabel>闹钟名称</SectionLabel>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="给这次折磨取个响亮的名字…"
            style={{
              width: '100%', border: 'none', background: COLORS.bg, borderRadius: 10,
              padding: '10px 12px', fontSize: 15, fontWeight: 600, color: COLORS.text,
              outline: 'none', boxSizing: 'border-box', fontFamily: "'Nunito','Noto Sans SC',sans-serif",
            }} />
        </div>

        {/* Method selection */}
        <div style={{ background: 'white', borderRadius: 16, padding: '14px 16px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <SectionLabel>😈 选择折磨方式</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {methodCards.map(mc => (
              <div key={mc.key} onClick={() => setMethod(mc.key)} style={{
                border: `2px solid ${method === mc.key ? mc.color : COLORS.border}`,
                borderRadius: 14, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                background: method === mc.key ? mc.color + '12' : 'transparent',
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 26 }}>{mc.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: method === mc.key ? mc.color : COLORS.text }}>{mc.title}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{mc.desc}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${method === mc.key ? mc.color : '#d0cce8'}`,
                  background: method === mc.key ? mc.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {method === mc.key && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { DEFAULT_ALARMS, HomeScreen, EditAlarmScreen });
