import React, { useState, useRef, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { 
  Headphones, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Search, 
  CheckCheck, 
  Plus, 
  Inbox, 
  Clock, 
  FolderOpen, 
  Circle,
  X,
  FileCheck,
  AlertCircle
} from 'lucide-react';

export const Support: React.FC = () => {
  const { 
    currentUser, 
    tickets, 
    createTicket, 
    addMessageToTicket, 
    resolveTicket,
    setTicketTyping,
    submitTicketRating
  } = usePlatform();

  const [activeTicketId, setActiveTicketId] = useState<string>('');
  
  // Create ticket states
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'wallet' | 'games' | 'account' | 'technical' | 'other'>('wallet');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newMsg, setNewMsg] = useState('');

  // Send message states
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Feedback states
  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');

  // Attachment simulator
  const [showAttach, setShowAttach] = useState(false);
  const mockAttachments = [
    { name: 'deposit_receipt_77A9BC.png', type: 'image', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=300&q=80' },
    { name: 'blockchain_hash_audit.txt', type: 'document', url: '#' },
    { name: 'screen_spin_error.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1540747737956-378724044432?auto=format&fit=crop&w=300&q=80' }
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear typing timeout on active ticket switch
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    // Reset rating form when ticket changes
    setRating(0);
    setFeedbackText('');
  }, [activeTicketId]);

  // Cleanup timers on component unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (tickets && tickets.length > 0 && !activeTicketId) {
      // Find tickets for this logged-in user
      const myTickets = tickets.filter(t => t.userId === currentUser?.id);
      if (myTickets.length > 0) {
        setActiveTicketId(myTickets[0].id);
      }
    }
  }, [tickets, currentUser, activeTicketId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicketId, tickets]);

  if (!currentUser) {
    return (
      <div className="text-center py-16" id="support-not-logged">
        <h3 className="text-lg font-bold">Authentication Required</h3>
        <p className="text-xs text-slate-400 mt-1">Please sign in to access the help desk chat.</p>
      </div>
    );
  }

  // Filter user's tickets
  const myTickets = tickets.filter(t => t.userId === currentUser.id);
  const activeTicket = tickets.find(t => t.id === activeTicketId);

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMsg) return;
    const tId = await createTicket(newTitle, newCategory, newPriority, newMsg);
    if (tId) {
      setActiveTicketId(tId);
    }
    setNewTitle('');
    setNewMsg('');
    setShowCreate(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeTicketId) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTicketTyping(activeTicketId, 'user', false);

    addMessageToTicket(activeTicketId, chatInput, 'user');
    setChatInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (activeTicketId) {
      setTicketTyping(activeTicketId, 'user', true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTicketTyping(activeTicketId, 'user', false);
      }, 1500);
    }
  };

  const handleAttachMock = (file: { name: string, type: string, url: string }) => {
    addMessageToTicket(activeTicketId, `Attached file: ${file.name}`, 'user', { name: file.name, url: file.url });
    setShowAttach(false);
  };

  // Filter messages in selected ticket based on search bar query
  const getFilteredMessages = () => {
    if (!activeTicket) return [];
    if (!searchQuery.trim()) return activeTicket.messages;
    return activeTicket.messages.filter(m => 
      m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-2" id="support-panel-main">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:h-[calc(100vh-145px)] min-h-[650px] glass rounded-3xl overflow-hidden shadow-sm">
        
        {/* Left column: Ticket List & Creator */}
        <div className="lg:col-span-1 border-r border-slate-200/40 dark:border-slate-800/40 flex flex-col h-full bg-transparent">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Headphones className="h-4.5 w-4.5 text-emerald-500" />
              <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Help Desk</h3>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
              title="Open support conversation"
              id="btn-open-ticket-trigger"
            >
              <Plus className="h-3 w-3" /> New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {myTickets.length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-slate-400 dark:text-slate-500 space-y-2">
                <Inbox className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="font-semibold text-slate-400">No active support conversations.</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-emerald-500 font-bold hover:underline"
                >
                  Create conversation
                </button>
              </div>
            ) : (
              myTickets.map(t => {
                const isActive = activeTicketId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTicketId(t.id);
                      setShowCreate(false);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28 ${
                      isActive 
                        ? 'bg-slate-900/80 border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.08)]' 
                        : 'border-slate-200/20 dark:border-white/5 hover:border-slate-300/30 dark:hover:border-white/10 bg-slate-900/10 dark:hover:bg-slate-900/20 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {/* Left glowing border tab when active */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-400 rounded-r-lg" />
                    )}

                    <div className="flex justify-between items-start gap-2 w-full">
                      <span className="font-mono text-[10px] font-bold text-slate-400/80">#{t.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase ${
                        t.status === 'open' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20' :
                        t.status === 'assigned' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' :
                        'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <h4 className="font-black text-xs text-slate-800 dark:text-white mt-1.5 line-clamp-1 w-full tracking-tight">
                      {t.title}
                    </h4>
                    
                    <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-slate-100/10 text-[9px] text-slate-400/80 font-mono">
                      <span className="capitalize font-bold bg-slate-100/10 dark:bg-slate-900/60 px-1.5 py-0.5 rounded">{t.category}</span>
                      <div className="flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-slate-600" />
                        <span className={`capitalize font-black ${t.priority === 'high' ? 'text-rose-500' : 'text-slate-500'}`}>
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Active ticket conversation window */}
        <div className="lg:col-span-3 flex flex-col h-full bg-transparent">
          
          {/* Creating ticket form overlay */}
          {showCreate ? (
            <div className="p-8 overflow-y-auto flex-1 flex flex-col justify-center" id="create-ticket-panel">
              <div className="max-w-md mx-auto w-full space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Submit New Support Request</h3>
                  <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Issue Subject Summary *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Deposit reference pending validation"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl glass-input text-xs dark:text-white"
                      id="ticket-input-title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs dark:text-white"
                        id="ticket-select-category"
                      >
                        <option value="wallet">Wallet & Funds</option>
                        <option value="games">Game Play Integrity</option>
                        <option value="account">Profile Security</option>
                        <option value="technical">Platform Bugs</option>
                        <option value="other">Other Inquiries</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        Priority Level
                      </label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs dark:text-white"
                        id="ticket-select-priority"
                      >
                        <option value="low">Low (Standard)</option>
                        <option value="medium">Medium (Moderate)</option>
                        <option value="high">High (Urgent)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Detailed Description of the problem *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Please elaborate on your concern..."
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl glass-input text-xs dark:text-white resize-none"
                      id="ticket-input-desc"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer"
                    id="btn-submit-ticket"
                  >
                    Open Official Support Thread
                  </button>
                </form>
              </div>
            </div>
          ) : activeTicket ? (
            <div className="flex flex-col h-full bg-slate-950/20">
              
              {/* Chat Top Banner - High-End Premium Styling */}
              <div className="p-4 border-b border-slate-200/20 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/10 dark:bg-white/2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-900 border-2 border-emerald-500 text-base shadow-lg shadow-emerald-500/10">
                      👩‍💻
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                        {activeTicket.agentName || 'On-Duty Support Companion'}
                      </h4>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-mono text-[8px] font-black tracking-wider uppercase">
                        Active VIP Agent
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                      <span>Thread Ref:</span> 
                      <span className="font-bold text-slate-300">#{activeTicket.id}</span>
                      <span className="text-slate-600">•</span>
                      <span>⭐ 4.9 Satisfaction • Avg response &lt; 2m</span>
                    </p>
                  </div>
                </div>

                {/* Ticket Title & Status Banner */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-300 font-mono max-w-[150px] truncate">
                      {activeTicket.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase ${
                      activeTicket.status === 'open' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      activeTicket.status === 'assigned' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                    }`}>
                      {activeTicket.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTicket.status !== 'resolved' ? (
                      <button
                        onClick={() => resolveTicket(activeTicket.id)}
                        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        id="btn-resolve-ticket"
                      >
                        Resolve & Close Thread
                      </button>
                    ) : (
                      <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-lg font-mono uppercase tracking-widest font-black">
                        COMPLETED
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat messages stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900 rounded-2xl text-center text-[10px] text-slate-400 font-mono shadow-inner">
                  Conversation started • Reference chat created on {new Date(activeTicket.createdAt).toLocaleString()}
                </div>

                {getFilteredMessages().map((m, idx, arr) => {
                  const isMe = m.sender === 'user';
                  // Group consecutive messages
                  const isSameSender = idx > 0 && arr[idx - 1].sender === m.sender;
                  const initials = m.senderName ? m.senderName.substring(0, 2).toUpperCase() : 'SP';

                  return (
                    <div 
                      key={m.id}
                      className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} ${isSameSender ? 'mt-1' : 'mt-4'}`}
                    >
                      {/* Left Avatar for Support/Agent */}
                      {!isMe && (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md border ${
                          isSameSender 
                            ? 'opacity-0 select-none pointer-events-none' 
                            : 'bg-slate-900 border-slate-700 text-emerald-400 dark:border-slate-800'
                        }`}>
                          {m.senderName?.includes('Agent') ? '👩‍💻' : '🎧'}
                        </div>
                      )}

                      <div className={`max-w-[72%] space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {/* Sender Name header */}
                        {!isSameSender && (
                          <div className="text-[10px] text-slate-400 font-bold font-mono tracking-wider flex items-center gap-1.5 px-1">
                            {m.senderName}
                            {!isMe && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                          </div>
                        )}
                        
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed inline-block relative border transition-all duration-300 ${
                          isMe 
                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white border-emerald-400/20 shadow-md shadow-emerald-500/5 rounded-tr-none hover:shadow-lg' 
                            : 'bg-slate-100/70 dark:bg-slate-900/80 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 rounded-tl-none shadow-xs'
                        }`}>
                          {m.text}

                          {/* Render clickable uploaded file image preview */}
                          {m.fileUrl && m.fileName?.match(/\.(jpg|jpeg|png|gif)/i) && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-slate-100/20 max-w-[220px] shadow-sm">
                              <img referrerPolicy="no-referrer" src={m.fileUrl} alt={m.fileName} className="w-full h-auto" />
                              <a 
                                href={m.fileUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="block bg-slate-950/80 p-2 text-[10px] text-center text-emerald-400 font-mono font-bold hover:underline"
                              >
                                View original attachment
                              </a>
                            </div>
                          )}

                          {m.fileUrl && !m.fileName?.match(/\.(jpg|jpeg|png|gif)/i) && (
                            <div className="mt-2 p-2 bg-black/20 rounded-lg flex items-center gap-2 text-[10px] font-mono text-emerald-400 border border-emerald-500/10">
                              <FileCheck className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[150px]">{m.fileName}</span>
                            </div>
                          )}
                        </div>

                        {/* Status/Timestamp footer */}
                        <div className={`flex items-center gap-1.5 text-[9px] text-slate-400/80 font-mono mt-0.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && (
                            <span className="text-emerald-500 flex items-center gap-0.5 font-bold">
                              <CheckCheck className="h-3 w-3" /> Read
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Avatar for User */}
                      {isMe && (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[11px] shadow-md border ${
                          isSameSender 
                            ? 'opacity-0 select-none pointer-events-none' 
                            : 'bg-gradient-to-tr from-amber-500 to-yellow-400 border-amber-400 text-slate-950'
                        }`}>
                          {initials}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Animated Typing Indicator bubble */}
                {activeTicket.supportIsTyping && (
                  <div className="flex items-start gap-2.5 mt-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md border bg-slate-900 border-slate-700 text-emerald-400 dark:border-slate-800">
                      🎧
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 font-bold font-mono px-1">
                        {activeTicket.agentName || 'Support Agent'} is typing...
                      </div>
                      <div className="bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200/20 dark:border-white/5 px-4 py-2.5 rounded-2xl rounded-tl-none inline-flex items-center gap-1.5 shadow-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input or Post-Resolution Star Feedback Form */}
              {activeTicket.status !== 'resolved' ? (
                <div className="p-3 border-t border-slate-200/20 dark:border-white/5 bg-slate-50/10 dark:bg-white/2 relative">
                  
                  {/* Premium Suggestion Chips Row */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 px-1 mb-1 no-scrollbar">
                    <span className="text-[9px] font-mono font-bold text-slate-400/80 uppercase tracking-widest shrink-0 self-center">Quick Actions:</span>
                    {[
                      { icon: '🎰', text: 'Validate Provably Fair Seeds' },
                      { icon: '💳', text: 'My deposit receipt is pending verification' },
                      { icon: '⚡', text: 'Expedite my withdrawal queue' },
                      { icon: '🎁', text: 'How do I claim Sunday Boost bonus?' }
                    ].map((chip) => (
                      <button
                        key={chip.text}
                        type="button"
                        onClick={() => {
                          setChatInput(chip.text);
                          if (activeTicketId) {
                            setTicketTyping(activeTicketId, 'user', true);
                          }
                        }}
                        className="px-2.5 py-1 rounded-full border border-slate-200/30 dark:border-white/5 bg-slate-100/40 dark:bg-slate-900/40 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-all shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <span>{chip.icon}</span>
                        <span>{chip.text}</span>
                      </button>
                    ))}
                  </div>

                  {/* File Attachment list slider */}
                  {showAttach && (
                    <div className="absolute bottom-16 left-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xl space-y-2 z-10 w-64 text-left">
                      <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 border-b border-slate-100 dark:border-slate-900 pb-1.5">
                        <span>SIMULATED FILE UPLOADS</span>
                        <button onClick={() => setShowAttach(false)}><X className="h-3 w-3" /></button>
                      </div>
                      <div className="space-y-1.5">
                        {mockAttachments.map(f => (
                          <button
                            key={f.name}
                            onClick={() => handleAttachMock(f)}
                            className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-xs text-left text-slate-600 dark:text-slate-300 font-semibold truncate"
                          >
                            {f.type === 'image' ? <ImageIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <Paperclip className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                            <span className="truncate">{f.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => setShowAttach(!showAttach)}
                      className="p-2 rounded-xl glass glass-hover text-slate-400 hover:text-slate-600 transition-colors"
                      title="Attach documents"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={chatInput}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs dark:text-white"
                      id="chat-input-text"
                    />

                    <button
                      type="submit"
                      className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md transition-all cursor-pointer"
                      id="btn-chat-send"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ) : !activeTicket.rating ? (
                /* Interactive Feedback Rating Widget - Luxury Styling */
                <div className="p-8 border-t border-slate-200/20 dark:border-white/5 bg-slate-900/30 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-5">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-amber-500/10 text-xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
                    🏆
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h4 className="font-black text-sm text-slate-800 dark:text-white tracking-tight">Rate your session with {activeTicket.agentName || 'our Support Officer'}</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Your ratings actively shape our concierge operations. Please rank our performance below.</p>
                  </div>
                  
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1.5 transition-all duration-300 transform hover:scale-125 cursor-pointer filter hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                      >
                        <svg 
                          className={`h-8 w-8 transition-all ${rating >= star ? 'text-amber-400 fill-current drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]' : 'text-slate-300 dark:text-slate-700 fill-none'} stroke-amber-400 stroke-1.5`} 
                          viewBox="0 0 24 24"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    ))}
                  </div>

                  <div className="w-full max-w-sm space-y-3">
                    <input
                      type="text"
                      placeholder="Optional comments for executive audit..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs dark:text-white border border-slate-200/20 dark:border-white/5 focus:border-amber-500/30 transition-all text-center"
                    />
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (rating === 0) {
                          alert('Please select a star rating first.');
                          return;
                        }
                        submitTicketRating(activeTicket.id, rating, feedbackText);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                    >
                      Submit Feedback
                    </button>
                  </div>
                </div>
              ) : (
                /* Rated State */
                <div className="p-6 border-t border-slate-200/20 dark:border-white/5 bg-slate-900/40 text-center space-y-3">
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">VIP RATING FILED:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={`text-xs ${activeTicket.rating! >= star ? 'text-amber-400' : 'text-slate-600'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {activeTicket.feedback && (
                    <p className="text-xs text-slate-400 italic max-w-xs mx-auto border-l-2 border-amber-500/30 pl-3">
                      "{activeTicket.feedback}"
                    </p>
                  )}
                  <div className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">
                    This support interaction is resolved and archived.
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 py-16 space-y-2">
              <Inbox className="h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">No ticket selected</h4>
              <p className="text-xs max-w-xs text-center">
                Select an ongoing discussion from the side list, or open a brand new ticket to talk with our representatives.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
