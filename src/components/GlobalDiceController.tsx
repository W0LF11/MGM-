import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { 
  Calendar, 
  Clock, 
  Trash2, 
  ShieldAlert, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  Check, 
  Coins, 
  Plus,
  Repeat
} from 'lucide-react';

export const GlobalDiceController: React.FC = () => {
  const { games, adminUpdateDiceGlobalOverrides } = usePlatform();
  const diceGame = games.find(g => g.id === 'dice');
  const globalOverrides = diceGame?.globalDiceOverrides || {};

  // Date and Time selectors
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedHour, setSelectedHour] = useState<string>(() => {
    return String(new Date().getHours()).padStart(2, '0');
  });
  const [selectedMinute, setSelectedMinute] = useState<string>(() => {
    const min = new Date().getMinutes();
    const rounded = Math.floor(min / 5) * 5;
    return String(rounded).padStart(2, '0');
  });

  // Occurrence selection: Repeating is true by default
  const [isRepeating, setIsRepeating] = useState<boolean>(true);

  // Override attributes
  const [outcome, setOutcome] = useState<'win' | 'lose' | 'random'>('win');
  const [targetCombo, setTargetCombo] = useState<string>('any');
  const [winPct, setWinPct] = useState<number>(100); // Default to 100% winning percentage
  const [lossPct, setLossPct] = useState<number>(100); 

  // Interactive Live Calculator Inputs
  const [testBetAmount, setTestBetAmount] = useState<number>(100);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync to current time frame immediately
  const setToCurrentTimeFrame = () => {
    const now = new Date();
    setSelectedDate(now.toISOString().split('T')[0]);
    setSelectedHour(String(now.getHours()).padStart(2, '0'));
    const currentMin = now.getMinutes();
    const roundedMin = Math.floor(currentMin / 5) * 5;
    setSelectedMinute(String(roundedMin).padStart(2, '0'));
  };

  // Calculate the 5-minute Frame/Period ID based on selection
  const getCalculatedPeriodId = (): { periodId: string; timeStr: string } => {
    if (!selectedDate) {
      return { periodId: '', timeStr: '' };
    }
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return { periodId: '', timeStr: '' };
    
    const [year, month, day] = parts;
    const yyyymmdd = `${year}${month}${day}`;
    const hrVal = parseInt(selectedHour) || 0;
    const minVal = parseInt(selectedMinute) || 0;
    const periodIndex = Math.floor((hrVal * 60 + minVal) / 5) + 1;
    const idxStr = String(periodIndex).padStart(3, '0');
    
    const periodId = isRepeating ? `daily-${idxStr}` : `${yyyymmdd}-${idxStr}`;
    
    const endMin = (minVal + 5) % 60;
    const endHr = minVal + 5 >= 60 ? (hrVal + 1) % 24 : hrVal;
    const timeStr = `${String(hrVal).padStart(2, '0')}:${String(minVal).padStart(2, '0')} - ${String(endHr).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    
    return { periodId, timeStr };
  };

  const { periodId, timeStr } = getCalculatedPeriodId();

  // Handle adding/saving a new override slot
  const handleAddOverride = async () => {
    if (!periodId) {
      setStatusMsg({ type: 'error', text: 'Invalid date selection' });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const slotData: any = { 
        outcome,
        isRepeating 
      };
      if (outcome === 'win') {
        if (targetCombo !== undefined) slotData.target = targetCombo;
        if (winPct !== undefined) slotData.winPct = winPct;
      } else if (outcome === 'lose') {
        if (lossPct !== undefined) slotData.lossPct = lossPct;
      }

      const updatedOverrides = {
        ...globalOverrides,
        [periodId]: slotData
      };

      await adminUpdateDiceGlobalOverrides(updatedOverrides);
      
      setStatusMsg({
        type: 'success',
        text: 'Saved Global Override!',
      });
      
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: `Error: ${err.message || 'Failed'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle removing an override slot
  const handleRemoveOverride = async (slotId: string) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const updatedOverrides = { ...globalOverrides };
      delete updatedOverrides[slotId];

      await adminUpdateDiceGlobalOverrides(updatedOverrides);
      
      setStatusMsg({
        type: 'success',
        text: 'Removed!',
      });
      
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: 'Failed to remove',
      });
    } finally {
      setLoading(false);
    }
  };

  // Clean all overrides
  const handleClearAllOverrides = async () => {
    if (!window.confirm('Are you absolutely sure you want to CLEAR ALL live global overrides for ALL users?')) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      await adminUpdateDiceGlobalOverrides({});
      setStatusMsg({
        type: 'success',
        text: 'Cleared All Overrides!',
      });
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: 'Failed to clear',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to format slot period to human-readable format
  const formatPeriodId = (id: string): string => {
    if (id.startsWith('daily-')) {
      const idxStr = id.split('-')[1];
      const pIdx = parseInt(idxStr);
      const totalMinutes = (pIdx - 1) * 5;
      const hr = Math.floor(totalMinutes / 60);
      const mn = totalMinutes % 60;
      const endMn = (mn + 5) % 60;
      const endHr = mn + 5 >= 60 ? (hr + 1) % 24 : hr;
      return `Daily Repeating (${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}-${String(endHr).padStart(2, '0')}:${String(endMn).padStart(2, '0')})`;
    }
    
    if (id.length < 12) return id;
    const y = id.substring(0, 4);
    const m = id.substring(4, 6);
    const d = id.substring(6, 8);
    const pStr = id.substring(9);
    const pIdx = parseInt(pStr);
    const totalMinutes = (pIdx - 1) * 5;
    const hr = Math.floor(totalMinutes / 60);
    const mn = totalMinutes % 60;
    
    const endMn = (mn + 5) % 60;
    const endHr = mn + 5 >= 60 ? (hr + 1) % 24 : hr;

    return `${d}/${m} (${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}-${String(endHr).padStart(2, '0')}:${String(endMn).padStart(2, '0')})`;
  };

  // Calculate live return preview values
  const winPayout = testBetAmount + (testBetAmount * winPct / 100);
  const lossPayout = testBetAmount * ((100 - lossPct) / 100);

  const presetsWinningCombos = [
    { value: 'any', label: '✨ Any Choice' },
    { value: 'big', label: '🔴 Big (11-18)' },
    { value: 'small', label: '🔵 Small (3-10)' },
    { value: 'odd', label: '🟢 Odd Sums' },
    { value: 'even', label: '🟣 Even Sums' },
  ];

  return (
    <div className="bg-slate-950 border-2 border-slate-800 p-6 rounded-3xl space-y-6 text-left shadow-2xl relative overflow-hidden text-xs text-slate-100">
      {/* Aesthetic pairing of Space Grotesk-like style and dark slate palette */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Mini Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl bg-indigo-500/20 p-2.5 rounded-2xl border-2 border-indigo-500/30">🎲</span>
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-1.5 leading-none">
              Dice Controller
            </h4>
            <p className="text-[11px] text-slate-300 mt-1 font-mono font-bold">
              Target ID Frame Rigging Settings
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={setToCurrentTimeFrame}
            className="p-2 px-3 bg-slate-850 hover:bg-slate-800 text-white rounded-xl font-extrabold text-[11.5px] border-2 border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Sync with current period frame"
          >
            <RefreshCw className="h-3.5 w-3.5 text-indigo-400 animate-spin-hover" /> Sync Now
          </button>
          {globalOverrides && Object.keys(globalOverrides).length > 0 && (
            <button
              onClick={handleClearAllOverrides}
              className="p-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl font-extrabold text-[11.5px] border-2 border-rose-900/40 cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Config Panel */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Time Frame Selection */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border-2 border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-black text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-400" /> 1. Select Time Period
              </span>
              
              {/* Repeating / One-time switcher */}
              <div className="flex bg-slate-950 border-2 border-slate-850 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsRepeating(true)}
                  className={`px-3 py-1 text-[10px] font-extrabold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    isRepeating 
                      ? 'bg-indigo-600 text-white font-black shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Repeat className="h-3 w-3" /> Repeating Daily
                </button>
                <button
                  type="button"
                  onClick={() => setIsRepeating(false)}
                  className={`px-3 py-1 text-[10px] font-extrabold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    !isRepeating 
                      ? 'bg-indigo-600 text-white font-black shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Calendar className="h-3 w-3" /> One-time
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1 font-mono">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  disabled={isRepeating}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border-2 border-slate-700 rounded-xl text-[11px] font-mono font-extrabold text-white focus:outline-none focus:border-indigo-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1 font-mono">Hour (24h)</label>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border-2 border-slate-700 rounded-xl text-[11px] font-mono font-extrabold text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  {Array.from({ length: 24 }).map((_, h) => {
                    const val = String(h).padStart(2, '0');
                    return <option key={val} value={val} className="bg-slate-950 text-white font-bold">{val}:00 ({h >= 12 ? 'PM' : 'AM'})</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1 font-mono">Minute Bracket</label>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border-2 border-slate-700 rounded-xl text-[11px] font-mono font-extrabold text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  {Array.from({ length: 12 }).map((_, m) => {
                    const val = String(m * 5).padStart(2, '0');
                    const nextVal = String(((m * 5) + 5) % 60).padStart(2, '0');
                    return <option key={val} value={val} className="bg-slate-950 text-white font-bold">{val}m - {nextVal}m</option>;
                  })}
                </select>
              </div>
            </div>

            {/* Display Period details condensed */}
            <div className="flex items-center justify-between p-3 bg-indigo-950/40 border-2 border-indigo-500/20 rounded-xl text-[11.5px]">
              <div className="flex items-center gap-1.5 text-slate-100 font-bold">
                <Clock className="h-4 w-4 text-indigo-400 animate-pulse" />
                <span>{timeStr}</span>
              </div>
              <div className="text-right text-indigo-300 font-mono font-bold">
                ID: <span className="text-white bg-slate-950 px-2.5 py-1 rounded border-2 border-slate-800 font-black">{periodId}</span>
              </div>
            </div>
          </div>

          {/* Outcome Decision Row */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border-2 border-slate-800 space-y-3">
            <span className="text-[11.5px] font-black text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-indigo-400" /> 2. Manual Outcome
            </span>

            {/* Compact Outcome tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOutcome('lose')}
                className={`py-3.5 px-2 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                  outcome === 'lose' 
                    ? 'bg-rose-500/25 border-rose-500 text-white font-black shadow-xl' 
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-rose-550 hover:text-white'
                }`}
              >
                <span className="text-xl">❌</span>
                <span className="text-[10px] uppercase font-black tracking-wider mt-1.5">Forced Loss</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('win')}
                className={`py-3.5 px-2 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                  outcome === 'win' 
                    ? 'bg-emerald-500/25 border-emerald-500 text-white font-black shadow-xl' 
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-emerald-550 hover:text-white'
                }`}
              >
                <span className="text-xl">👑</span>
                <span className="text-[10px] uppercase font-black tracking-wider mt-1.5">Forced Win</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('random')}
                className={`py-3.5 px-2 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                  outcome === 'random' 
                    ? 'bg-blue-500/25 border-blue-500 text-white font-black shadow-xl' 
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-blue-550 hover:text-white'
                }`}
              >
                <span className="text-xl">🎲</span>
                <span className="text-[10px] uppercase font-black tracking-wider mt-1.5">Randomized</span>
              </button>
            </div>

            {/* Condition winning prediction choice */}
            {outcome === 'win' && (
              <div className="space-y-3.5 pt-1.5 animate-fadeIn">
                <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block font-mono">
                  Winning Combination / Number
                </label>
                
                {/* Horizontal wrap for predictions */}
                <div className="flex flex-wrap gap-2">
                  {presetsWinningCombos.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setTargetCombo(preset.value)}
                      className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold transition-all border-2 cursor-pointer ${
                        targetCombo === preset.value
                          ? 'bg-indigo-650/40 border-indigo-400 text-white font-black shadow-lg'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-650'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Specific numbers 3-18 select chips */}
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-950 rounded-xl border-2 border-slate-800">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const sumNum = String(i + 3);
                    const isSelected = targetCombo === sumNum;
                    return (
                      <button
                        key={sumNum}
                        type="button"
                        onClick={() => setTargetCombo(sumNum)}
                        className={`h-7 w-7 rounded-lg text-[10.5px] font-black font-mono transition-all flex items-center justify-center border-2 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-300 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        {sumNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Winning Percentage Section */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border-2 border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-black text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-indigo-400" /> 3. Winning Percentage
              </span>
              <span className="text-[10px] font-black font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                0% - 100% Win Rate
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block font-mono">
                  Exact Win Rate for Users
                </label>
                <span className="text-xs font-mono font-black text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-xl border border-indigo-500/20">
                  {outcome === 'lose' ? (100 - lossPct) : winPct}% Win
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={outcome === 'lose' ? (100 - lossPct) : winPct}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (outcome === 'lose') {
                        setLossPct(100 - val);
                      } else {
                        setWinPct(val);
                      }
                    }}
                    className="w-full accent-indigo-500 h-1.5 cursor-pointer bg-slate-850 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border-2 border-slate-800 text-[11px] font-mono">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={outcome === 'lose' ? (100 - lossPct) : winPct}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      if (outcome === 'lose') {
                        setLossPct(100 - val);
                      } else {
                        setWinPct(val);
                      }
                    }}
                    className="w-10 text-center text-white bg-transparent font-black focus:outline-none"
                  />
                  <span className="text-slate-400 font-black">%</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal font-bold font-mono">
                During this slot, players' return is rigged to exactly <span className="text-indigo-400 font-extrabold">{outcome === 'lose' ? (100 - lossPct) : winPct}%</span> of their bet amount.
              </p>
            </div>
          </div>
        </div>

        {/* Right Active Rigging Bento Column */}
        <div className="lg:col-span-5 bg-slate-900/90 p-4 rounded-2xl border-2 border-slate-800 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-[11.5px] font-black text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              Active Overrides
            </span>
            <span className="text-[10.5px] font-black font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              {globalOverrides ? Object.keys(globalOverrides).length : 0} Total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2.5 pr-1">
            {Object.keys(globalOverrides).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950 p-4">
                <AlertCircle className="h-8 w-8 text-slate-500 mb-2.5" />
                <span className="text-[11px] text-slate-200 font-extrabold uppercase tracking-wider font-mono">No Active Overrides</span>
                <span className="text-[10px] text-slate-400 mt-1.5 max-w-[190px] leading-relaxed font-medium">
                  Every round operates under normal RNG. Click Save Overriding Slot to rig a time slot.
                </span>
              </div>
            ) : (
              Object.entries(globalOverrides)
                .sort(([slotA], [slotB]) => slotA.localeCompare(slotB))
                .map(([slotId, override]) => {
                  const isWin = override.outcome === 'win';
                  const isRepeated = slotId.startsWith('daily-');
                  return (
                    <div
                      key={slotId}
                      className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden flex items-center justify-between ${
                        isWin 
                          ? 'bg-emerald-950/30 border-emerald-800 hover:border-emerald-500' 
                          : 'bg-rose-950/30 border-rose-800 hover:border-rose-500'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9.5px] font-black font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-700 text-white">
                            ID: {slotId}
                          </span>
                          <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isWin ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {isWin ? '👑 Win' : '❌ Loss'}
                          </span>
                          {isRepeated && (
                            <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider font-mono flex items-center gap-1">
                              <Repeat className="h-2.5 w-2.5" /> Daily
                            </span>
                          )}
                        </div>
                        
                        <div className="text-[10.5px] text-white font-extrabold font-mono">
                          {formatPeriodId(slotId)}
                        </div>

                        <div className="text-[9.5px] text-slate-300 font-bold font-mono">
                          {isWin ? (
                            <span>Combos: <strong className="text-emerald-300 uppercase">{override.target || 'any'}</strong> (Win Rate: <strong className="text-indigo-300 font-extrabold">{override.winPct ?? 100}%</strong>)</span>
                          ) : (
                            <span>Outcome: <strong className="text-rose-300">Loss</strong> (Win Rate: <strong className="text-rose-300 font-extrabold">{override.lossPct !== undefined ? (100 - override.lossPct) : 0}%</strong>)</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveOverride(slotId)}
                        className="p-2 bg-slate-950 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 rounded-xl border-2 border-slate-850 transition-all cursor-pointer active:scale-95"
                        title="Delete slot rigging"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>

      {/* Action Row */}
      <div className="flex items-center gap-3 pt-2 relative z-10">
        <button
          type="button"
          disabled={loading}
          onClick={handleAddOverride}
          className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-[12px] uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 hover:shadow-indigo-500/25 border border-indigo-500/20"
        >
          {loading ? 'Saving Live Rigging...' : <><Plus className="h-4.5 w-4.5" /> Save Overriding Slot</>}
        </button>

        {statusMsg && (
          <div className={`p-3 px-5 rounded-xl border-2 text-[11px] font-black uppercase font-mono shadow-md animate-fadeIn ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
              : 'bg-rose-500/20 border-rose-500 text-rose-300'
          }`}>
            {statusMsg.text}
          </div>
        )}
      </div>

    </div>
  );
};
