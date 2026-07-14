import React, { useState } from 'react';
import { UserProfile } from '../types';
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
  Plus
} from 'lucide-react';

interface DiceControllerProps {
  user: UserProfile;
  adminUpdateUserProfile: (userId: string, data: Partial<UserProfile>) => Promise<any>;
}

export const DiceController: React.FC<DiceControllerProps> = ({ user, adminUpdateUserProfile }) => {
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

  // Override attributes
  const [outcome, setOutcome] = useState<'win' | 'lose' | 'random'>('lose');
  const [targetCombo, setTargetCombo] = useState<string>('any');
  const [winPct, setWinPct] = useState<number>(96); // under 100
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
    const periodId = `${yyyymmdd}-${String(periodIndex).padStart(3, '0')}`;
    
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
      const currentOverrides = user.diceOverrides || {};
      const updatedOverrides = {
        ...currentOverrides,
        [periodId]: {
          outcome,
          target: outcome === 'win' ? targetCombo : undefined,
          winPct: outcome === 'win' ? winPct : undefined,
          lossPct: outcome === 'lose' ? lossPct : undefined,
        }
      };

      await adminUpdateUserProfile(user.id, { diceOverrides: updatedOverrides });
      
      setStatusMsg({
        type: 'success',
        text: 'Saved!',
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
      const currentOverrides = { ...user.diceOverrides };
      delete currentOverrides[slotId];

      await adminUpdateUserProfile(user.id, { diceOverrides: currentOverrides });
      
      setStatusMsg({
        type: 'success',
        text: 'Removed!',
      });
      
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: 'Failed',
      });
    } finally {
      setLoading(false);
    }
  };

  // Clean all overrides
  const handleClearAllOverrides = async () => {
    if (!window.confirm('Clear all manual overrides for this user?')) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      await adminUpdateUserProfile(user.id, { diceOverrides: {} });
      setStatusMsg({
        type: 'success',
        text: 'Cleared All!',
      });
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: 'Failed',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to format slot period to human-readable format
  const formatPeriodId = (id: string): string => {
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
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4 text-left shadow-lg relative overflow-hidden text-xs">
      
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* Mini Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎲</span>
          <div>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5 leading-none">
              Dice Controller 
              <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                @{user.username}
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
              Target ID Frame Rigging Settings
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={setToCurrentTimeFrame}
            className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-[10px] border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
            title="Sync with current period frame"
          >
            <RefreshCw className="h-3 w-3" /> Sync Now
          </button>
          {user.diceOverrides && Object.keys(user.diceOverrides).length > 0 && (
            <button
              onClick={handleClearAllOverrides}
              className="p-1 px-2 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 rounded font-bold text-[10px] border border-rose-500/25 cursor-pointer flex items-center gap-1 transition-all"
            >
              <Trash2 className="h-3 w-3" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Config Panel */}
        <div className="lg:col-span-7 space-y-3.5">
          
          {/* Time Frame Selection */}
          <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-800/60 space-y-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" /> 1. Select Time Period
            </span>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Hour (24h)</label>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {Array.from({ length: 24 }).map((_, h) => {
                    const val = String(h).padStart(2, '0');
                    return <option key={val} value={val}>{val}:00 ({h >= 12 ? 'PM' : 'AM'})</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Minute Bracket</label>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {Array.from({ length: 12 }).map((_, m) => {
                    const val = String(m * 5).padStart(2, '0');
                    const nextVal = String(((m * 5) + 5) % 60).padStart(2, '0');
                    return <option key={val} value={val}>{val}m - {nextVal}m</option>;
                  })}
                </select>
              </div>
            </div>

            {/* Display Period details condensed */}
            <div className="flex items-center justify-between p-2 bg-indigo-950/15 border border-indigo-500/10 rounded-lg text-[10px]">
              <div className="flex items-center gap-1 text-slate-300">
                <Clock className="h-3 w-3 text-indigo-400" />
                <span className="font-bold">{timeStr}</span>
              </div>
              <div className="text-right text-indigo-400 font-mono font-bold">
                ID: <span className="text-white bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{periodId}</span>
              </div>
            </div>
          </div>

          {/* Outcome Decision Row */}
          <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-800/60 space-y-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" /> 2. Manual Outcome
            </span>

            {/* Tight, compact Outcome tabs */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setOutcome('lose')}
                className={`py-2 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                  outcome === 'lose' 
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 font-extrabold shadow' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-sm">❌</span>
                <span className="text-[9px] uppercase tracking-wider mt-0.5">Forced Loss</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('win')}
                className={`py-2 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                  outcome === 'win' 
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-extrabold shadow' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-sm">👑</span>
                <span className="text-[9px] uppercase tracking-wider mt-0.5">Forced Win</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('random')}
                className={`py-2 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                  outcome === 'random' 
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 font-extrabold shadow' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-sm">🎲</span>
                <span className="text-[9px] uppercase tracking-wider mt-0.5">Randomized</span>
              </button>
            </div>

            {/* Condition winning prediction choice */}
            {outcome === 'win' && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Winning Combination / Number
                </label>
                
                {/* Horizontal wrap for predictions */}
                <div className="flex flex-wrap gap-1">
                  {presetsWinningCombos.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setTargetCombo(preset.value)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all border cursor-pointer ${
                        targetCombo === preset.value
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Specific numbers 3-18 select chips (ultra-dense micro display) */}
                <div className="flex flex-wrap gap-1 p-1 bg-slate-900/60 rounded border border-slate-800/80">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const sumNum = String(i + 3);
                    const isSelected = targetCombo === sumNum;
                    return (
                      <button
                        key={sumNum}
                        type="button"
                        onClick={() => setTargetCombo(sumNum)}
                        className={`h-5 w-5 rounded text-[9px] font-black font-mono transition-all flex items-center justify-center border cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500 border-indigo-400 text-white shadow'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-white'
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

          {/* Return matrix & calculator condensed */}
          {outcome !== 'random' && (
            <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-indigo-400" /> 3. Payout Adjustment & Simulation
                </span>
                
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                  <span className="text-[9px] text-slate-400 font-mono font-bold">Wager: ₹</span>
                  <input
                    type="number"
                    value={testBetAmount}
                    onChange={(e) => setTestBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-10 bg-transparent text-white font-mono font-black text-center focus:outline-none"
                  />
                </div>
              </div>

              {/* Slider Row */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={outcome === 'win' ? winPct : lossPct}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (outcome === 'win') setWinPct(val);
                      else setLossPct(val);
                    }}
                    className="w-full accent-indigo-500 h-1 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850 text-[10px] font-mono">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={outcome === 'win' ? winPct : lossPct}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                      if (outcome === 'win') setWinPct(val);
                      else setLossPct(val);
                    }}
                    className="w-8 text-center text-white bg-transparent font-black focus:outline-none"
                  />
                  <span className="text-slate-400 font-black">%</span>
                </div>
              </div>

              {/* Tiny payout return status boxes */}
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                <div className={`p-1.5 rounded border ${outcome === 'win' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900/40 border-slate-850'}`}>
                  <span className="text-slate-400 block text-[9px] font-bold">ON WIN RETURN</span>
                  <strong className="text-emerald-400 font-mono text-xs block">₹{winPayout.toFixed(2)}</strong>
                </div>

                <div className={`p-1.5 rounded border ${outcome === 'lose' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-900/40 border-slate-850'}`}>
                  <span className="text-slate-400 block text-[9px] font-bold">ON LOSS RETURN</span>
                  <strong className="text-rose-400 font-mono text-xs block">₹{lossPayout.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={handleAddOverride}
              className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {loading ? 'Saving...' : <><Plus className="h-3.5 w-3.5" /> Save Overriding Slot</>}
            </button>

            {statusMsg && (
              <div className={`p-1.5 px-2.5 rounded-lg border text-[10px] font-bold uppercase font-mono ${
                statusMsg.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
              }`}>
                {statusMsg.text}
              </div>
            )}
          </div>

        </div>

        {/* Right Active Rigging Bento Column */}
        <div className="lg:col-span-5 bg-slate-950/30 p-3 rounded-lg border border-slate-800/60 flex flex-col space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1">
              Active Overrides
            </span>
            <span className="text-[9px] font-bold font-mono bg-indigo-550/15 text-indigo-400 px-1.5 py-0.5 rounded-full border border-indigo-500/20">
              {user.diceOverrides ? Object.keys(user.diceOverrides).length : 0} Total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[320px] space-y-1.5 pr-0.5">
            {!user.diceOverrides || Object.keys(user.diceOverrides).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-800 rounded-lg bg-slate-900/20 p-4">
                <AlertCircle className="h-6 w-6 text-slate-600 mb-1.5" />
                <span className="text-[10px] text-slate-350 font-bold uppercase tracking-wider font-mono">No Active Overrides</span>
                <span className="text-[9px] text-slate-500 mt-1 max-w-[150px] leading-relaxed">
                  Defaults to random odds.
                </span>
              </div>
            ) : (
              Object.entries(user.diceOverrides)
                .sort(([slotA], [slotB]) => slotA.localeCompare(slotB))
                .map(([slotId, override]) => {
                  const isWin = override.outcome === 'win';
                  return (
                    <div
                      key={slotId}
                      className={`p-2 rounded-lg border text-left transition-all relative overflow-hidden flex items-center justify-between ${
                        isWin 
                          ? 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-500/30' 
                          : 'bg-rose-950/20 border-rose-900/40 hover:border-rose-500/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black font-mono bg-slate-900 px-1 rounded border border-slate-850">
                            ID: {slotId}
                          </span>
                          <span className={`text-[8px] font-bold uppercase px-1 rounded ${
                            isWin ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isWin ? '👑 Win' : '❌ Loss'}
                          </span>
                        </div>
                        
                        <div className="text-[9px] text-slate-300 font-mono">
                          {formatPeriodId(slotId)}
                        </div>

                        <div className="text-[8px] text-slate-400 font-mono">
                          {isWin ? (
                            <span>Combos: <strong className="text-emerald-400 uppercase">{override.target || 'any'}</strong> ({override.winPct ?? 96}% Pct)</span>
                          ) : (
                            <span>Outcome: <strong className="text-rose-400">Loss ({override.lossPct ?? 100}%)</strong></span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleRemoveOverride(slotId)}
                        className="p-1 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded border border-slate-800 transition-all cursor-pointer"
                        title="Delete slot rigging"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
