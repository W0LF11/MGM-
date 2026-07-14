import React, { useState, useRef } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  UploadCloud, 
  FileCheck, 
  ShieldCheck, 
  X,
  CreditCard,
  Building2,
  ListFilter,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Wallet: React.FC = () => {
  const { 
    currentUser, 
    transactions, 
    requests,
    requestDeposit, 
    requestWithdrawal
  } = usePlatform();

  // Calculate total pending withdrawals for the current user to enforce available balance locks
  const pendingWithdrawalTotal = (requests || [])
    .filter(r => r.userId === currentUser?.id && r.type === 'withdrawal' && r.status === 'pending')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const availableBalance = Math.max(0, (currentUser?.balance ?? 0) - pendingWithdrawalTotal);

  // Selected tab for transaction section
  const [activeFormTab, setActiveFormTab] = useState<'deposit' | 'withdraw'>('deposit');

  // Deposit Form State
  const [depAmount, setDepAmount] = useState<string>('');
  const [proofImage, setProofImage] = useState<string>('');
  const [receiptUploaded, setReceiptUploaded] = useState<boolean>(false);
  const [isSubmittingDep, setIsSubmittingDep] = useState<boolean>(false);
  const [depSuccessMessage, setDepSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Withdrawal Form State
  const [wdAmount, setWdAmount] = useState<string>('');
  const [wdUpi, setWdUpi] = useState<string>('');
  const [wdBankName, setWdBankName] = useState<string>('');
  const [wdHolderName, setWdHolderName] = useState<string>('');
  const [wdAccountNumber, setWdAccountNumber] = useState<string>('');
  const [wdRouting, setWdRouting] = useState<string>('');
  const [isSubmittingWd, setIsSubmittingWd] = useState<boolean>(false);
  const [wdSuccessMessage, setWdSuccessMessage] = useState<string | null>(null);

  // File change handler for proof uploads with image compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 600; // max width/height to keep image size tiny but legible
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress as JPEG with 0.6 quality (around 20-40KB)
            const compressed = canvas.toDataURL('image/jpeg', 0.6);
            setProofImage(compressed);
            setReceiptUploaded(true);
          } else {
            setProofImage(reader.result as string);
            setReceiptUploaded(true);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Process Deposit Request Submission
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please specify a valid deposit amount.');
      return;
    }
    if (!receiptUploaded || !proofImage) {
      alert('Verification Failed: Please upload your payment receipt image proof.');
      return;
    }

    setIsSubmittingDep(true);
    setDepSuccessMessage(null);
    try {
      const refId = `DEP_${Math.floor(Math.random() * 900000 + 100000)}`;
      await requestDeposit(amt, refId, 'MGM Direct Escrow Bank', proofImage);
      setDepSuccessMessage('Your request for deposit is under verification with our team');
      setDepAmount('');
      setProofImage('');
      setReceiptUploaded(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Failed to submit deposit request. Please try again.';
      if (err) {
        const message = err.message || String(err);
        try {
          const parsed = JSON.parse(message);
          errorMsg = `Failed to submit deposit request: ${parsed.error || message}`;
        } catch {
          errorMsg = `Failed to submit deposit request: ${message}`;
        }
      }
      alert(errorMsg);
    } finally {
      setIsSubmittingDep(false);
    }
  };

  // Process Withdrawal Request Submission
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((currentUser?.creditScore ?? 100) < 80) {
      alert(`Withdrawal Blocked / 提款已被管控: Your current Trust Index score is ${currentUser?.creditScore ?? 100}/100. Accounts with a score below 80 are subject to compliance audits and security holds. Please contact your account executive to restore trust. / 您的當前信用分數為 ${currentUser?.creditScore ?? 100}/100。評分低於80分的賬戶須接受合規審計與安全管控，請聯繫您的賬戶經理以恢復信用。`);
      return;
    }

    const amt = parseFloat(wdAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please specify a valid withdrawal amount.');
      return;
    }
    if (amt > availableBalance) {
      alert(`Insufficient available wallet balance! Your available balance is ₹${availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, because you have ₹${pendingWithdrawalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} locked in pending withdrawals.`);
      return;
    }

    // At least UPI ID or Bank account details are mandatory
    const hasUpi = wdUpi.trim().length > 0;
    const hasBank = wdBankName.trim().length > 0 && 
                    wdHolderName.trim().length > 0 && 
                    wdAccountNumber.trim().length > 0 && 
                    wdRouting.trim().length > 0;

    if (!hasUpi && !hasBank) {
      alert('Verification Failed: You must complete either the Bank Account details or the UPI ID field.');
      return;
    }

    setIsSubmittingWd(true);
    setWdSuccessMessage(null);
    try {
      let payoutAddress = '';
      if (hasUpi) {
        payoutAddress = `UPI ID: ${wdUpi.trim()}`;
      } else {
        payoutAddress = `Bank: ${wdBankName.trim()} | Holder: ${wdHolderName.trim()} | A/C: ${wdAccountNumber.trim()} | Routing/IFSC: ${wdRouting.trim()}`;
      }

      const success = await requestWithdrawal(amt, payoutAddress, hasUpi ? 'UPI Payout' : 'Bank Transfer');
      if (success) {
        setWdSuccessMessage('Your request for withdrawal is under verification with our team');
        setWdAmount('');
        setWdUpi('');
        setWdBankName('');
        setWdHolderName('');
        setWdAccountNumber('');
        setWdRouting('');
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Failed to submit withdrawal request.';
      if (err) {
        const message = err.message || String(err);
        try {
          const parsed = JSON.parse(message);
          errorMsg = `Failed to submit withdrawal request: ${parsed.error || message}`;
        } catch {
          errorMsg = `Failed to submit withdrawal request: ${message}`;
        }
      }
      alert(errorMsg);
    } finally {
      setIsSubmittingWd(false);
    }
  };

  // Fetch transaction history directly from context (which includes deduplicated requests and cleared transactions)
  const userRequestsAndTransactions = transactions
    .filter(t => t.userId === currentUser?.id)
    .sort((a, b) => new Date(b.date || b.timestamp || 0).getTime() - new Date(a.date || a.timestamp || 0).getTime());

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-12" id="wallet-viewport-container">
      
      {/* 1. HERO BALANCE SECTION (Centered, high-contrast, modern Gen-Z typography) */}
      <div className="text-center space-y-4 py-6 relative" id="aesthetic-balance-hero">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent blur-3xl pointer-events-none -z-10" />
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono tracking-widest text-emerald-400 uppercase">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secured Escrow Account
        </div>
        
        <div className="space-y-1">
          <p className="text-[11px] font-mono tracking-widest uppercase text-slate-400 font-bold">
            Available Ledger Balance
          </p>
          <h1 className="text-5xl md:text-6xl font-sans font-black tracking-tighter text-emerald-400 select-none">
            ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h1>
        </div>

        <div className="flex justify-center items-center gap-6 text-[11px] text-slate-400 font-mono">
          <div>
            <span className="text-slate-600">Total Balance:</span> <span className="text-slate-300 font-bold">${(currentUser?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          {pendingWithdrawalTotal > 0 && (
            <>
              <div>
                <span className="text-rose-400 font-bold">Pending Lock:</span> <span className="text-rose-400 font-bold">-${pendingWithdrawalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="h-3 w-px bg-slate-800" />
            </>
          )}
          <div>
            <span className="text-slate-600">Rating:</span> <span className="text-emerald-400 font-bold">{currentUser?.creditScore || 95}/100</span>
          </div>
        </div>
      </div>

      {/* 2. STRUCTURED SCROLLABLE TRANSACTION HISTORY TABLE */}
      <div className="rounded-3xl bg-slate-950 border border-slate-800/80 p-6 space-y-4 shadow-xl" id="scrollable-ledger-history">
        <div className="flex justify-between items-center pb-2 border-b border-slate-850">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono">
              Live Audited Financial Log
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            {userRequestsAndTransactions.length} total entries
          </span>
        </div>

        {/* Structured Table with inner scroll container */}
        <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/40">
          <div className="max-h-[250px] overflow-y-auto">
            <table className="w-full text-left border-collapse font-mono text-[11px]">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                  <th className="py-3 px-4">Ref ID / ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Method / Destination</th>
                  <th className="py-3 px-4 text-right">Amount (USD)</th>
                  <th className="py-3 px-4 text-center">Audit Status</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {userRequestsAndTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No matching transaction vouchers on record.
                    </td>
                  </tr>
                ) : (
                  userRequestsAndTransactions.map((item, index) => {
                    const isDeposit = item.type === 'deposit';
                    const isWithdrawal = item.type === 'withdrawal';
                    const isPending = item.status === 'pending';
                    const isRejected = item.status === 'rejected';
                    const isApproved = item.status === 'approved' || item.status === 'completed';

                    let badgeColor = 'text-slate-400 bg-slate-900 border-slate-800';
                    let statusText: string = item.status;
                    if (isApproved) {
                      badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                      statusText = 'Settled';
                    } else if (isPending) {
                      badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                      statusText = 'Verifying';
                    } else if (isRejected) {
                      badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                      statusText = 'Rejected';
                    }

                    const typeColor = isDeposit 
                      ? 'text-emerald-400' 
                      : isWithdrawal 
                        ? 'text-rose-400' 
                        : 'text-slate-400';

                    return (
                      <tr 
                        key={`${item.id}-${index}`} 
                        className="hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-300">
                          {item.reference || item.id}
                        </td>
                        <td className="py-3.5 px-4 capitalize">
                          <span className={`inline-flex items-center gap-1 font-bold ${typeColor}`}>
                            {isDeposit ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : isWithdrawal ? (
                              <ArrowDownLeft className="h-3 w-3" />
                            ) : null}
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 max-w-[180px] truncate">
                          <div>
                            <span className="block font-bold text-slate-300">
                              {item.gateway || item.method || 'System Internal'}
                            </span>
                            {item.payoutAddress && (
                              <span className="block text-[10px] text-slate-500 font-mono truncate" title={item.payoutAddress}>
                                {item.payoutAddress}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`py-3.5 px-4 text-right font-black ${typeColor}`}>
                          {isDeposit ? '+' : '-'}${(item.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${badgeColor}`}>
                            {statusText}
                          </span>
                          {isRejected && item.rejectionReason && (
                            <span className="block text-[9px] text-rose-400 mt-0.5 truncate max-w-[140px] mx-auto" title={item.rejectionReason}>
                              {item.rejectionReason}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-500 text-[10px]">
                          {new Date(item.date || item.timestamp || '').toLocaleDateString()} {new Date(item.date || item.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. CLEAN UNIFIED DEPOSIT & WITHDRAW SECTIONS */}
      <div className="rounded-3xl bg-slate-950 border border-slate-800/80 shadow-2xl overflow-hidden" id="unified-actions-form-box">
        {/* Navigation Selector */}
        <div className="grid grid-cols-2 border-b border-slate-850">
          <button
            type="button"
            onClick={() => setActiveFormTab('deposit')}
            className={`py-4 text-xs font-mono font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeFormTab === 'deposit'
                ? 'bg-slate-900 text-white border-b-2 border-emerald-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ArrowUpRight className={`h-4 w-4 ${activeFormTab === 'deposit' ? 'text-emerald-400' : ''}`} />
            Deposit Funds
          </button>
          
          <button
            type="button"
            onClick={() => setActiveFormTab('withdraw')}
            className={`py-4 text-xs font-mono font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeFormTab === 'withdraw'
                ? 'bg-slate-900 text-white border-b-2 border-blue-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ArrowDownLeft className={`h-4 w-4 ${activeFormTab === 'withdraw' ? 'text-blue-400' : ''}`} />
            Request Cashout
          </button>
        </div>

        {/* Tab content wrapper */}
        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {activeFormTab === 'deposit' ? (
              <motion.div
                key="deposit-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-black font-mono text-white uppercase tracking-wider">
                    Initiate Deposit Verification
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Enter the amount you sent and upload your transaction receipt.
                  </p>
                </div>

                {depSuccessMessage && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs flex items-start gap-2.5 animate-pulse">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">Deposit Lodged Successfully</span>
                      <p className="mt-0.5 leading-relaxed font-mono text-[11px]">
                        {depSuccessMessage}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleDepositSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Unified Amount Input */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                        Amount to Deposit ($ USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-slate-400 font-bold text-sm">$</span>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 250"
                          value={depAmount}
                          onChange={(e) => setDepAmount(e.target.value)}
                          className="w-full pl-8 pr-4 py-3 bg-slate-900 rounded-xl border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Unified Proof Image File Upload */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                        Payment Receipt Proof
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        id="deposit-receipt-file-input"
                      />
                      
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`py-3 px-4 rounded-xl border border-dashed cursor-pointer text-center transition-all flex items-center justify-center gap-3 min-h-[46px] ${
                          receiptUploaded
                            ? 'bg-emerald-500/5 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-750 text-slate-400'
                        }`}
                      >
                        {receiptUploaded ? (
                          <>
                            <FileCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span className="text-[11px] font-bold text-emerald-400 truncate max-w-[200px]">
                              Proof Image Attached
                            </span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4 w-4 text-slate-500 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-400">Click to upload screenshot receipt</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingDep}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-850 disabled:text-slate-500 disabled:opacity-40 rounded-xl text-xs font-black transition-all shadow-lg text-white flex items-center justify-center gap-1.5 uppercase tracking-widest font-mono cursor-pointer"
                  >
                    {isSubmittingDep ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent shrink-0" />
                        Verifying Deposit Proof...
                      </>
                    ) : (
                      <>
                        Submit Deposit Claim
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="withdraw-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-black font-mono text-white uppercase tracking-wider">
                    Submit Cashout Claim
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    At least one destination target (UPI or Bank account) is required to receive funds.
                  </p>
                </div>

                {(currentUser?.creditScore ?? 100) < 80 && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-500 animate-pulse flex items-start gap-3.5" id="withdrawal-gating-alert">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-wider">安全信用審查警報 / COMPLIANCE AUDIT ACTIVE</h4>
                      <p className="text-xs font-medium leading-relaxed text-amber-300">
                        Your current Trust Index is <strong className="text-amber-400 font-black">{(currentUser?.creditScore ?? 100)}/100</strong>. Accounts with a score below 80 are subject to compliance audits and security holds. Please contact your account executive to restore trust.
                      </p>
                      <p className="text-[11px] leading-relaxed text-amber-400/80 font-medium mt-1">
                        您的當前信用指數為 <strong>{(currentUser?.creditScore ?? 100)}/100</strong>。評分低於80分的賬戶須接受合規審計與安全管控，請聯繫您的賬戶經理以恢復信用。
                      </p>
                    </div>
                  </div>
                )}

                {wdSuccessMessage && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs flex items-start gap-2.5 animate-pulse">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">Withdrawal Lodged</span>
                      <p className="mt-0.5 leading-relaxed font-mono text-[11px]">
                        {wdSuccessMessage}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleWithdrawSubmit} className="space-y-6">
                  {/* Amount to Withdraw */}
                  <div className="space-y-2 max-w-md">
                    <label className="block text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                      Amount to Withdraw ($ USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-bold text-sm">$</span>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 150"
                        value={wdAmount}
                        onChange={(e) => setWdAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-900 rounded-xl border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                    {parseFloat(wdAmount) > (currentUser?.balance || 0) && (
                      <p className="text-[9px] text-rose-400 font-mono">Amount exceeds available ledger balance.</p>
                    )}
                  </div>

                  {/* Settle Fields */}
                  <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-850 space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                        UPI Address (VPA)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. name@upi"
                        value={wdUpi}
                        onChange={(e) => setWdUpi(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 rounded-xl border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-3 my-2">
                      <div className="h-px bg-slate-850 flex-1" />
                      <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold font-mono">OR</span>
                      <div className="h-px bg-slate-850 flex-1" />
                    </div>

                    {/* Bank Transfer Details (no "Optional" word anymore) */}
                    <div className="space-y-3">
                      <span className="block text-[10px] font-mono uppercase font-black text-slate-400 tracking-wider">
                        Bank Deposit Account Details
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-slate-500 uppercase block">Bank Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Chase Bank"
                            value={wdBankName}
                            onChange={(e) => setWdBankName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-slate-500 uppercase block">Holder Name</label>
                          <input
                            type="text"
                            placeholder="e.g. John Doe"
                            value={wdHolderName}
                            onChange={(e) => setWdHolderName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-slate-500 uppercase block">Account Number</label>
                          <input
                            type="text"
                            placeholder="e.g. 10023495811"
                            value={wdAccountNumber}
                            onChange={(e) => setWdAccountNumber(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-slate-500 uppercase block">IFSC / Routing Code</label>
                          <input
                            type="text"
                            placeholder="e.g. IFSC00123"
                            value={wdRouting}
                            onChange={(e) => setWdRouting(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingWd || parseFloat(wdAmount) > (currentUser?.balance || 0)}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-850 disabled:text-slate-500 disabled:opacity-40 rounded-xl text-xs font-black transition-all shadow-lg text-white flex items-center justify-center gap-1.5 uppercase tracking-widest font-mono cursor-pointer"
                  >
                    {isSubmittingWd ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent shrink-0" />
                        Logging Withdrawal Review...
                      </>
                    ) : (
                      <>
                        Request Cashout Settlement
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};
