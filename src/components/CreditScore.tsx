import React from 'react';
import { usePlatform } from '../context/PlatformContext';
import { motion } from 'motion/react';
import mgmLogo from '../assets/images/mgm_logo_1783507972249.jpg';
import { ShieldAlert, ShieldCheck, HelpCircle, FileClock, ChevronRight, Award, AlertTriangle, RefreshCw } from 'lucide-react';

export const CreditScore: React.FC = () => {
  const { currentUser, transactions } = usePlatform();
  const score = currentUser?.creditScore ?? 100;

  // Filter credit adjustments
  const creditLogs = transactions.filter(t => t.type === 'credit_adjustment');

  // Rating translation and styling
  let ratingLabelCh = '至尊高信用';
  let ratingLabelEn = 'Supreme Royal Trust';
  let ratingDesc = 'Excellent score. Your wallet enjoys instant withdrawals and top-tier priority processing.';
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let strokeColor = '#10b981'; // emerald-500

  if (score === 100) {
    ratingLabelCh = '至尊金級信用';
    ratingLabelEn = 'Supreme Platinum Trust';
    ratingDesc = 'Ultimate high trust standing. Eligible for VIP private tables and immediate ledger settlement.';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    strokeColor = '#f59e0b'; // amber-500
  } else if (score >= 90) {
    ratingLabelCh = '卓越尊貴信用';
    ratingLabelEn = 'Excellent Prestige Trust';
    ratingDesc = 'Excellent score. Your wallet enjoys instant withdrawals and standard fast processing.';
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    strokeColor = '#10b981';
  } else if (score >= 80) {
    ratingLabelCh = '優良合規信用';
    ratingLabelEn = 'Verified High Trust';
    ratingDesc = 'Standard trust status. Ensure clean transaction cycles to keep your standing high.';
    badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    strokeColor = '#6366f1'; // indigo-500
  } else {
    ratingLabelCh = '風險合規管控';
    ratingLabelEn = 'Restricted Compliance Hold';
    ratingDesc = 'Action Required. Score fell below 80. Security gates have been activated for compliance auditing.';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    strokeColor = '#f43f5e'; // rose-500
  }

  // Calculate circular stroke
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="credit-score-root">
      
      {/* 1. Header Hero section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/30 border border-slate-100/5 dark:border-white/5 p-6 md:p-8" id="credit-hero">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <img 
              src={mgmLogo} 
              alt="MGM Logo" 
              className="h-16 w-16 rounded-2xl object-cover shadow-lg border border-amber-500/20 flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  MGM RISK MANAGEMENT
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-sans font-black tracking-tight text-slate-800 dark:text-white mt-2">
                美高梅信用評級 <span className="font-mono text-xl text-slate-500 dark:text-slate-400 font-normal">/ Trust Index</span>
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xl font-medium leading-relaxed">
                MGM operates an autonomous cryptographic ledger. Each transaction, spin, and withdrawal request is evaluated against risk metrics to compute your score dynamically.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/40 border border-slate-800/50 p-4 rounded-2xl md:self-center">
            <Award className="h-6 w-6 text-amber-500" />
            <div className="font-mono text-left">
              <p className="text-[10px] text-slate-500 font-bold uppercase">MGM ACCOUNT EXECUTIVE</p>
              <p className="text-xs font-bold text-slate-300">Compliance Desk Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Gauge & Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="credit-grid-main">
        
        {/* Left Column: Visual Gauge */}
        <div className="lg:col-span-1 rounded-3xl bg-white dark:bg-slate-900/35 border border-slate-200/50 dark:border-slate-800/40 p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden" id="credit-card-meter">
          <div className="absolute top-4 left-4 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Real-Time Sync</span>
          </div>

          {/* Svg Circle Gauge */}
          <div className="relative h-44 w-44 flex items-center justify-center mt-4">
            <svg className="absolute transform -rotate-90 w-full h-full">
              <circle
                cx="88"
                cy="88"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="88"
                cy="88"
                r={radius}
                stroke={strokeColor}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-4xl font-sans font-black tracking-tighter text-slate-900 dark:text-white block">
                {score}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase block">
                / 100 max
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2 w-full">
            <div className={`mx-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-extrabold ${badgeColor}`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{ratingLabelCh}</span>
              <span className="opacity-60">|</span>
              <span className="text-[10px] uppercase font-mono">{ratingLabelEn}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium px-4">
              {ratingDesc}
            </p>
          </div>
        </div>

        {/* Right Column: Educational Guidelines & Gating status */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900/35 border border-slate-200/50 dark:border-slate-800/40 p-6 flex flex-col justify-between shadow-sm" id="credit-card-details">
          
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <HelpCircle className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                信用評估標準與恢復指引 / Gating & Compliance Rules
              </h2>
            </div>

            {/* Gating Logic Banner if < 80 */}
            {score < 80 ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-800 dark:text-rose-400 animate-pulse flex items-start gap-3.5"
                id="gating-alert-banner"
              >
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider">安全審查管控激活 / SECURITY CONTROL GATE ACTIVATED</h4>
                  <p className="text-xs font-medium leading-relaxed text-rose-600 dark:text-rose-300">
                    Your current Trust Index is <strong className="text-rose-500 font-black">{score}/100</strong>. Accounts with a score below 80 are subject to compliance audits and security holds. Please contact your account executive or fulfill assignments to restore trust.
                  </p>
                  <p className="text-[11px] leading-relaxed text-rose-500/80 font-medium mt-1">
                    您的當前信用指數為 <strong>{score}/100</strong>。評分低於80分的賬戶須接受合規審計與安全管控，請聯繫您的賬戶經理或完成指定任務以恢復信用。
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 text-emerald-800 dark:text-emerald-400 flex items-start gap-3.5">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider">安全與交易環境良好 / SECURITY STATUS CLEARED</h4>
                  <p className="text-xs font-medium leading-relaxed text-emerald-600 dark:text-emerald-300/90">
                    Excellent trust rating! Your withdrawal gateways are fully active and cleared. Keep maintaining clean gaming sessions and verified bank links to bypass audits.
                  </p>
                  <p className="text-[11px] leading-relaxed text-emerald-500/80 font-medium mt-1">
                    當前信用狀況極佳，提款通道已解鎖。請保持良好的遊玩記錄和綁定有效的銀行賬戶，以便直接跳過安全審計。
                  </p>
                </div>
              </div>
            )}

            {/* Instruction Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/30">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                  ⚠️ 扣分行為 / Score Deductions
                </h5>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-2 mt-2 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>Submitting fake or recycled transaction receipts.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>Repeatedly cancelling withdrawal requests.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>Suspicious high-frequency ledger triggers.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/30">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                  ✨ 增加分數與恢復 / Score Restoration
                </h5>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-2 mt-2 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Fulfill regular premium tasks or support tickets.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Complete consecutive high-integrity game sets.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Direct restoration via premium operator audit.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap justify-between items-center gap-4 text-xs font-medium text-slate-400">
            <span>Risk Desk: GMT-07 Risk Engine Online</span>
            <span className="font-mono text-emerald-500">MGM SECURITY DEEP MIND ACTIVED</span>
          </div>

        </div>
      </div>

    </div>
  );
};
