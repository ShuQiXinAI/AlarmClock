// alarm-unlock.jsx — RingingScreen, MathUnlock, BlinkUnlock, ShakeUnlock, SuccessScreen

// ===== RINGING SCREEN =====
const RingingScreen = ({ alarm, onDismiss, onCancel }) => {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const m = DISMISS_METHODS[alarm.method];
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  return (
    <div style={{
      height: '100%', position: 'relative', overflow: 'hidden',
      background: `linear-gradient(160deg, oklch(0.18 0.20 272) 0%, oklch(0.10 0.12 290) 60%, oklch(0.08 0.08 310) 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '28px 24px 40px',
      fontFamily: "'Nunito','Noto Sans SC',sans-serif",
    }}>
      {/* Pulse rings */}
      {[200,280,360].map((size, i) => (
        <div key={i} style={{
          position: 'absolute', top: '38%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: size, height: size, borderRadius: '50%',
          background: m.color + (i === 0 ? '30' : i === 1 ? '18' : '0c'),
          animation: `pulse-ring 2s ease-out infinite ${i * 0.5}s`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Top label */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: 20,
          padding: '6px 14px', fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 700,
        }}>
          {alarm.label}
        </div>
      </div>

      {/* Center */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: 76, lineHeight: 1, animation: 'bell-shake 0.45s ease-in-out infinite' }}>🔔</div>
        <div style={{ fontSize: 70, fontWeight: 900, color: 'white', letterSpacing: '-4px', marginTop: 10, lineHeight: 1 }}>
          {timeStr}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 10, fontWeight: 600 }}>
          起床啦！打工人！ 💼
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
          你的老板已经到了（大概）
        </div>
      </div>

      {/* Buttons */}
      <div style={{ width: '100%', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onDismiss} style={{
          width: '100%', padding: '16px',
          background: `linear-gradient(135deg, ${m.color}, ${m.color}bb)`,
          border: 'none', borderRadius: 18, cursor: 'pointer',
          color: 'white', fontWeight: 900, fontSize: 17,
          boxShadow: `0 6px 28px ${m.color}66`, fontFamily: 'inherit',
          letterSpacing: '0.02em',
        }}>
          {m.emoji} 关闭闹钟（{m.label}）
        </button>
        <button onClick={onCancel} style={{
          width: '100%', padding: '13px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 18, cursor: 'pointer',
          color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
        }}>
          再睡5分钟（此功能已被你亲手禁用 😈）
        </button>
      </div>
    </div>
  );
};

// ===== MATH UNLOCK =====
const MathUnlockScreen = ({ onSuccess, onBack }) => {
  const genProblem = () => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * 3)];
    let a, b, ans;
    if (op === '+') { a = Math.floor(Math.random()*60)+10; b = Math.floor(Math.random()*60)+10; ans = a+b; }
    else if (op === '-') { a = Math.floor(Math.random()*60)+30; b = Math.floor(Math.random()*30)+5; ans = a-b; }
    else { a = Math.floor(Math.random()*9)+2; b = Math.floor(Math.random()*9)+2; ans = a*b; }
    return { expr: `${a} ${op} ${b}`, ans };
  };
  const [problems] = React.useState(() => [genProblem(), genProblem(), genProblem()]);
  const [current, setCurrent] = React.useState(0);
  const [input, setInput] = React.useState('');
  const [status, setStatus] = React.useState(''); // '' | 'wrong' | 'right'
  const [wrongCount, setWrongCount] = React.useState(0);

  const wrongMsgs = ['不对！你真的醒了吗？🤔', '又答错了！小学白念了吧', '这道题比你的工资还简单！', '再算一遍！脑子呢？'];
  const handleNum = (n) => { if (status) return; setInput(p => p.length < 6 ? p + n : p); };
  const handleDel = () => setInput(p => p.slice(0, -1));
  const handleSubmit = () => {
    if (!input) return;
    if (parseInt(input) === problems[current].ans) {
      setStatus('right');
      setTimeout(() => {
        setStatus(''); setInput('');
        if (current >= 2) onSuccess();
        else setCurrent(c => c + 1);
      }, 700);
    } else {
      setStatus('wrong');
      setWrongCount(c => c + 1);
      setTimeout(() => { setStatus(''); setInput(''); }, 1000);
    }
  };

  const numpad = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']];

  return (
    <div style={{ height: '100%', background: COLORS.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Nunito','Noto Sans SC',sans-serif", overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px 10px', background: 'white', boxShadow: '0 1px 0 #ede8ff' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BackButton onBack={onBack} />
          <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 800, color: COLORS.text, marginRight: 32 }}>🧮 答题解锁</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 18px', gap: 12, overflow: 'hidden' }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              height: 7, borderRadius: 4,
              width: i === current ? 28 : 20,
              background: i < current ? COLORS.success : i === current ? COLORS.accent : COLORS.border,
              transition: 'all 0.3s',
            }} />
          ))}
          <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 700, marginLeft: 4 }}>{current+1}/3</span>
        </div>

        {/* Problem card */}
        <div style={{
          background: 'white', borderRadius: 20, padding: '20px 16px',
          boxShadow: status === 'wrong' ? `0 4px 20px ${COLORS.danger}30` : status === 'right' ? `0 4px 20px ${COLORS.success}30` : `0 4px 20px ${COLORS.accent}20`,
          border: `2px solid ${status === 'wrong' ? COLORS.danger : status === 'right' ? COLORS.success : COLORS.accent}44`,
          textAlign: 'center',
          animation: status === 'wrong' ? 'shake 0.5s' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>计算下面的题目 ✏️</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: COLORS.text, letterSpacing: '-1px' }}>
            {problems[current].expr} = ?
          </div>
          <div style={{
            marginTop: 12, fontSize: 44, fontWeight: 900, letterSpacing: '-2px', minHeight: 56,
            color: status === 'wrong' ? COLORS.danger : status === 'right' ? COLORS.success : COLORS.text,
          }}>
            {status === 'right' ? '✓' : input || <span style={{ color: COLORS.border }}>_</span>}
          </div>
          {status === 'wrong' && (
            <div style={{ fontSize: 12, color: COLORS.danger, marginTop: 2, fontWeight: 700 }}>
              {wrongMsgs[wrongCount % wrongMsgs.length]}
            </div>
          )}
        </div>

        {/* Numpad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {numpad.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 7 }}>
              {row.map((key, ki) => (
                <button key={ki} onClick={() => key === '⌫' ? handleDel() : key ? handleNum(key) : null}
                  style={{
                    flex: 1, height: 48, borderRadius: 13, border: 'none',
                    cursor: key ? 'pointer' : 'default',
                    background: key === '⌫' ? COLORS.dangerLight : key ? 'white' : 'transparent',
                    fontSize: key === '⌫' ? 18 : 22, fontWeight: 700,
                    color: key === '⌫' ? COLORS.danger : COLORS.text,
                    boxShadow: key && key !== '⌫' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    fontFamily: 'inherit',
                  }}>
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>

        <button onClick={handleSubmit} disabled={!input || !!status} style={{
          width: '100%', padding: '14px', borderRadius: 16, border: 'none',
          background: input && !status ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primary})` : COLORS.border,
          color: input && !status ? 'white' : COLORS.textMuted,
          fontWeight: 800, fontSize: 16, cursor: input && !status ? 'pointer' : 'default',
          fontFamily: 'inherit', transition: 'all 0.2s',
        }}>
          确认答案 ✓
        </button>
      </div>
    </div>
  );
};

// ===== BLINK UNLOCK =====
const BlinkUnlockScreen = ({ onSuccess, onBack }) => {
  const [blinks, setBlinks] = React.useState(0);
  const [phase, setPhase] = React.useState('waiting'); // waiting | scanning | blinked | done
  const TARGET = 3;

  const startDetect = () => setPhase('scanning');

  const simulateBlink = () => {
    if (phase !== 'scanning' || blinks >= TARGET) return;
    setPhase('blinked');
    setTimeout(() => {
      const nb = blinks + 1;
      setBlinks(nb);
      if (nb >= TARGET) { setPhase('done'); setTimeout(onSuccess, 900); }
      else setPhase('scanning');
    }, 350);
  };

  const blinkHints = ['对准摄像头，眨眼3次', '再眨一次！快！', '最后一下！', '通过了！'];

  return (
    <div style={{ height: '100%', background: COLORS.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Nunito','Noto Sans SC',sans-serif" }}>
      <div style={{ padding: '12px 20px 10px', background: 'white', boxShadow: '0 1px 0 #ede8ff' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BackButton onBack={onBack} />
          <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 800, color: COLORS.text, marginRight: 32 }}>👁️ 眨眼解锁</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 20px', gap: 16 }}>
        {/* Viewfinder */}
        <div onClick={simulateBlink} style={{
          width: '100%', aspectRatio: '1/1', maxHeight: 230,
          background: phase === 'waiting' ? '#12102a' : '#0a0818',
          borderRadius: 22, position: 'relative', overflow: 'hidden',
          boxShadow: `0 8px 32px ${COLORS.primary}33`,
          border: `2px solid ${phase === 'done' ? COLORS.success : COLORS.primary}55`,
          cursor: phase === 'scanning' ? 'pointer' : 'default',
        }}>
          {/* Scanlines */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.04,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 4px)' }} />

          {phase === 'waiting' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ fontSize: 44 }}>📷</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textAlign: 'center', padding: '0 24px' }}>
                点击"开始检测"<br/>让摄像头确认你没在睡觉
              </div>
            </div>
          )}

          {phase !== 'waiting' && (
            <>
              {/* Face outline oval */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-55%)',
                width: 110, height: 130, borderRadius: '50%',
                border: `2px solid ${phase === 'done' ? COLORS.success : COLORS.accent}`,
                boxShadow: `0 0 24px ${phase === 'done' ? COLORS.success : COLORS.accent}55`,
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }} />
              {/* Corner brackets */}
              {[[-6,-8,1,0,1,0],[106,-8,0,1,1,0],[-6,118,1,0,0,1],[106,118,0,1,0,1]].map(([x,y,bl,br,bt,bb], idx) => (
                <div key={idx} style={{
                  position: 'absolute',
                  left: `calc(50% - 55px + ${x}px)`, top: `calc(50% - 65px + ${y}px)`,
                  width: 14, height: 14,
                  borderLeft: bl ? `2px solid ${COLORS.accent}` : 'none',
                  borderRight: br ? `2px solid ${COLORS.accent}` : 'none',
                  borderTop: bt ? `2px solid ${COLORS.accent}` : 'none',
                  borderBottom: bb ? `2px solid ${COLORS.accent}` : 'none',
                }} />
              ))}
              {/* Eyes */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-60%)',
                display: 'flex', gap: 22, marginTop: -8,
              }}>
                {[0,1].map(i => (
                  <div key={i} style={{
                    width: 26, height: phase === 'blinked' ? 3 : 16,
                    borderRadius: phase === 'blinked' ? 2 : 12,
                    background: phase === 'done' ? COLORS.success : COLORS.accent,
                    boxShadow: `0 0 10px ${phase === 'done' ? COLORS.success : COLORS.accent}`,
                    transition: 'height 0.18s, border-radius 0.18s',
                  }} />
                ))}
              </div>
              {/* Status */}
              <div style={{
                position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center',
                fontSize: 12, color: phase === 'done' ? COLORS.success : 'rgba(255,255,255,0.75)', fontWeight: 700,
              }}>
                {phase === 'scanning' ? '检测中 · 点击屏幕模拟眨眼' : phase === 'blinked' ? '✓ 眨眼检测到！' : '🎉 全部完成！'}
              </div>
              {/* Scanning bar */}
              {phase === 'scanning' && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)`,
                  animation: 'scan-bar 1.5s linear infinite',
                  opacity: 0.8,
                }} />
              )}
            </>
          )}
        </div>

        {/* Blink counter */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 46, height: 46, borderRadius: '50%',
              background: i < blinks ? COLORS.primary : COLORS.primaryLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: i < blinks ? 20 : 16,
              color: i < blinks ? 'white' : COLORS.textMuted, fontWeight: 800,
              boxShadow: i < blinks ? `0 4px 14px ${COLORS.primary}44` : 'none',
              transition: 'all 0.3s',
            }}>
              {i < blinks ? '👁️' : i + 1}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text }}>{blinkHints[blinks]}</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>
            已眨眼 {blinks} / {TARGET} 次
          </div>
        </div>

        {phase === 'waiting' && (
          <button onClick={startDetect} style={{
            width: '100%', padding: '15px', borderRadius: 16, border: 'none',
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer',
            boxShadow: `0 4px 18px ${COLORS.primary}44`, fontFamily: 'inherit',
          }}>
            开始人脸检测 📷
          </button>
        )}
      </div>
    </div>
  );
};

// ===== SHAKE UNLOCK =====
const ShakeUnlockScreen = ({ onSuccess, onBack }) => {
  const TARGET = 30;
  const [count, setCount] = React.useState(0);
  const [shaking, setShaking] = React.useState(false);
  const [phase, setPhase] = React.useState('idle');
  const intervalRef = React.useRef(null);
  const holdRef = React.useRef(false);

  const startShake = () => {
    if (phase === 'done') return;
    holdRef.current = true;
    setShaking(true);
    setPhase('shaking');
    intervalRef.current = setInterval(() => {
      if (!holdRef.current) return;
      setCount(c => {
        const nc = c + 1;
        if (nc >= TARGET) {
          clearInterval(intervalRef.current);
          setShaking(false);
          setPhase('done');
          setTimeout(onSuccess, 800);
          return nc;
        }
        return nc;
      });
    }, 80);
  };

  const stopShake = () => {
    holdRef.current = false;
    setShaking(false);
    if (phase !== 'done') setPhase('idle');
    clearInterval(intervalRef.current);
  };

  React.useEffect(() => () => clearInterval(intervalRef.current), []);

  const progress = Math.min(count / TARGET, 1);
  const r = 52, circ = 2 * Math.PI * r;

  const msgs = ['长按下方按钮开始摇！', '继续！别停！', '快到了！坚持住！', '就差一点！！', '🎉 摇醒了！'];
  const msgIdx = count === 0 ? 0 : count < 10 ? 1 : count < 20 ? 2 : count < TARGET ? 3 : 4;

  return (
    <div style={{ height: '100%', background: COLORS.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Nunito','Noto Sans SC',sans-serif" }}>
      <div style={{ padding: '12px 20px 10px', background: 'white', boxShadow: '0 1px 0 #ede8ff' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BackButton onBack={onBack} />
          <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 800, color: COLORS.text, marginRight: 32 }}>📳 摇晃解锁</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', padding: '10px 24px' }}>
        {/* Progress ring */}
        <div style={{ position: 'relative', width: 130, height: 130 }}>
          <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="65" cy="65" r={r} fill="none" stroke={COLORS.border} strokeWidth="10" />
            <circle cx="65" cy="65" r={r} fill="none"
              stroke={phase === 'done' ? COLORS.success : COLORS.danger}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 0.1s, stroke 0.3s' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: COLORS.text, lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>/ {TARGET}</div>
          </div>
        </div>

        {/* Phone animation */}
        <div style={{
          fontSize: 70,
          animation: shaking ? 'phone-shake 0.12s linear infinite' : 'none',
          filter: shaking ? `drop-shadow(0 0 18px ${COLORS.danger}88)` : 'none',
          transition: 'filter 0.2s',
          userSelect: 'none',
        }}>📱</div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: phase === 'done' ? COLORS.success : COLORS.text }}>{msgs[msgIdx]}</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>
            {phase !== 'done' ? '长按"摇摇摇"按钮，模拟摇晃手机' : '清醒了！太棒了打工人！'}
          </div>
        </div>

        {/* Big shake button */}
        <button
          onMouseDown={startShake} onMouseUp={stopShake} onMouseLeave={stopShake}
          onTouchStart={startShake} onTouchEnd={stopShake} onTouchCancel={stopShake}
          disabled={phase === 'done'}
          style={{
            width: 150, height: 150, borderRadius: '50%', border: 'none',
            background: phase === 'done'
              ? `radial-gradient(circle at 40% 35%, ${COLORS.success}ee, ${COLORS.success})`
              : shaking
              ? `radial-gradient(circle at 40% 35%, #ff6b4a, ${COLORS.danger})`
              : `radial-gradient(circle at 40% 35%, ${COLORS.danger}cc, ${COLORS.danger}88)`,
            color: 'white', fontWeight: 900, fontSize: 22,
            cursor: phase === 'done' ? 'default' : 'pointer',
            boxShadow: shaking ? `0 0 40px ${COLORS.danger}88, 0 8px 24px ${COLORS.danger}44` : `0 8px 24px ${COLORS.danger}44`,
            transition: 'all 0.12s',
            transform: shaking ? 'scale(0.95)' : 'scale(1)',
            fontFamily: 'inherit',
            userSelect: 'none',
          }}
        >
          {phase === 'done' ? '✓ 成功！' : '摇摇摇！'}
        </button>
      </div>
    </div>
  );
};

// ===== SUCCESS SCREEN =====
const SuccessScreen = ({ alarm, onHome }) => {
  const msgs = ["你终于起来了！可喜可贺！", "打工人！冲鸭！今天也要卷！", "你的床正在哭泣 😢", "今天又是对抗地心引力成功的一天！"];
  const [msg] = React.useState(() => msgs[Math.floor(Math.random() * msgs.length)]);
  return (
    <div style={{
      height: '100%',
      background: `linear-gradient(145deg, ${COLORS.successLight}, ${COLORS.bg})`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', fontFamily: "'Nunito','Noto Sans SC',sans-serif", gap: 18,
    }}>
      <div style={{ fontSize: 78, animation: 'pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>🎉</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: COLORS.text, textAlign: 'center', lineHeight: 1.3 }}>
        闹钟已关闭！
      </div>
      <div style={{ fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 1.7, maxWidth: 260 }}>
        {msg}
      </div>
      <div style={{
        background: 'white', borderRadius: 18, padding: '16px 24px',
        boxShadow: `0 4px 20px ${COLORS.success}22`, textAlign: 'center', width: '100%',
        border: `1px solid ${COLORS.success}33`,
      }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: COLORS.success }}>+ 10 积分</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>成功解锁 · 连续打卡进度 +1 🔥</div>
      </div>
      <button onClick={onHome} style={{
        width: '100%', padding: '15px', borderRadius: 16, border: 'none',
        background: `linear-gradient(135deg, ${COLORS.success}, oklch(0.58 0.22 145))`,
        color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer',
        boxShadow: `0 4px 18px ${COLORS.success}44`, fontFamily: 'inherit',
      }}>
        开始新的一天 ☀️
      </button>
    </div>
  );
};

Object.assign(window, { RingingScreen, MathUnlockScreen, BlinkUnlockScreen, ShakeUnlockScreen, SuccessScreen });
