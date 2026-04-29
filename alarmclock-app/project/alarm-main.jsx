// alarm-main.jsx — App root + Router + Tweaks

const App = () => {
  const [screen, setScreen] = React.useState('home');
  const [alarms, setAlarms] = React.useState(DEFAULT_ALARMS);
  const [editAlarm, setEditAlarm] = React.useState(null);
  const [ringAlarm, setRingAlarm] = React.useState(null);

  const go = (s) => setScreen(s);

  const handleEdit = (alarm) => { setEditAlarm(alarm); go('edit'); };
  const handleSave = (alarm) => {
    setAlarms(prev => prev.find(a => a.id === alarm.id)
      ? prev.map(a => a.id === alarm.id ? alarm : a)
      : [...prev, alarm]);
    go('home');
  };
  const handleRing = (alarm) => { setRingAlarm(alarm); go('ringing'); };
  const handleDismiss = () => { if (ringAlarm) go('unlock-' + ringAlarm.method); };

  const screenMap = {
    home:         <HomeScreen alarms={alarms} setAlarms={setAlarms} onEdit={handleEdit} onSimulateRing={handleRing} onStats={() => go('stats')} />,
    edit:         <EditAlarmScreen alarm={editAlarm} onSave={handleSave} onBack={() => go('home')} />,
    ringing:      ringAlarm && <RingingScreen alarm={ringAlarm} onDismiss={handleDismiss} onCancel={() => go('home')} />,
    'unlock-math':  <MathUnlockScreen onSuccess={() => go('success')} onBack={() => go('ringing')} />,
    'unlock-blink': <BlinkUnlockScreen onSuccess={() => go('success')} onBack={() => go('ringing')} />,
    'unlock-shake': <ShakeUnlockScreen onSuccess={() => go('success')} onBack={() => go('ringing')} />,
    success:      ringAlarm && <SuccessScreen alarm={ringAlarm} onHome={() => go('home')} />,
    stats:        <StatsScreen onBack={() => go('home')} />,
  };

  // --- Tweaks ---
  const { TweaksPanel, TweakSection, TweakRadio, TweakColor, useTweaks } = window;
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "theme": "light",
    "accentHue": "indigo",
    "ringingStyle": "dramatic"
  }/*EDITMODE-END*/);

  // Apply tweaks to COLORS live
  React.useEffect(() => {
    const hueMap = { indigo: '272', fuchsia: '310', amber: '38', teal: '162' };
    const h = hueMap[tweaks.accentHue] || '272';
    COLORS.primary      = `oklch(0.52 0.30 ${h})`;
    COLORS.primaryLight = `oklch(0.95 0.05 ${h})`;
    COLORS.primaryDark  = `oklch(0.30 0.26 ${h})`;
    // force re-render
    setScreen(s => s);
  }, [tweaks.accentHue]);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: tweaks.theme === 'dark'
        ? 'linear-gradient(135deg, #0a0614 0%, #150d2e 100%)'
        : 'linear-gradient(135deg, oklch(0.86 0.08 272) 0%, oklch(0.88 0.07 310) 50%, oklch(0.90 0.06 340) 100%)',
      transition: 'background 0.4s',
    }}>
      <IOSDevice dark={screen === 'ringing'}>
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          {screenMap[screen] || screenMap['home']}
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakSection label="主题背景">
          <TweakRadio id="theme" label="" options={[{value:'light',label:'浅色'},{value:'dark',label:'深色'}]}
            value={tweaks.theme} onChange={v => setTweak('theme', v)} />
        </TweakSection>
        <TweakSection label="主题色调">
          <TweakRadio id="accentHue" label="" options={[
            {value:'indigo', label:'靛蓝'},
            {value:'fuchsia',label:'品红'},
            {value:'amber',  label:'琥珀'},
            {value:'teal',   label:'青碧'},
          ]} value={tweaks.accentHue} onChange={v => setTweak('accentHue', v)} />
        </TweakSection>
        <TweakSection label="当前界面">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              ['home','🏠 主页'],['edit','✏️ 编辑闹钟'],['ringing','🔔 响铃中'],
              ['unlock-math','🧮 答题解锁'],['unlock-blink','👁️ 眨眼解锁'],
              ['unlock-shake','📳 摇晃解锁'],['success','🎉 解锁成功'],['stats','📊 统计']
            ].map(([s, label]) => (
              <button key={s} onClick={() => {
                if (s === 'ringing' && !ringAlarm) setRingAlarm(alarms[0]);
                if ((s === 'unlock-math' || s === 'unlock-blink' || s === 'unlock-shake' || s === 'success') && !ringAlarm) setRingAlarm(alarms[0]);
                go(s);
              }} style={{
                background: screen === s ? COLORS.primary : '#f0ecff',
                color: screen === s ? 'white' : COLORS.text,
                border: 'none', borderRadius: 8, padding: '7px 10px',
                fontWeight: 700, fontSize: 12, cursor: 'pointer', textAlign: 'left',
                fontFamily: "'Nunito','Noto Sans SC',sans-serif",
                transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
