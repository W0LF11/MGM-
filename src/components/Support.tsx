import React, { useState, useRef, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../context/firebase';
import { 
  Headphones, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Search, 
  CheckCheck, 
  Inbox, 
  X,
  FileCheck,
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { SupportTicket, SupportMessage } from '../types';

export const Support: React.FC = () => {
  const { 
    currentUser, 
    tickets, 
    addMessageToTicket, 
    resolveTicket,
    setTicketTyping,
    submitTicketRating
  } = usePlatform();

  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const directTicketId = currentUser ? `CHAT_${currentUser.id}` : '';
  const activeTicket = tickets.find(t => t.id === directTicketId);

  const activeTicketMessagesLength = activeTicket?.messages.length || 0;
  const lastMessageSender = activeTicket?.messages[activeTicket.messages.length - 1]?.sender;

  // Track previous message length to detect actual changes for scrolling
  const prevMessageLengthRef = useRef<number>(0);

  // Auto-initialize the direct support chat on mount if not exists
  useEffect(() => {
    if (!currentUser) return;
    
    const initDirectChat = async () => {
      const ticketId = `CHAT_${currentUser.id}`;
      const existsLocally = tickets.some(t => t.id === ticketId);
      if (existsLocally) return;

      try {
        const ticketRef = doc(db, 'tickets', ticketId);
        const snap = await getDoc(ticketRef);
        if (!snap.exists()) {
          const agents = ['Agent Emma', 'Agent Liam', 'Supervisor Sophia', 'Analyst Dave', 'VIP Concierge Chloe'];
          const randomAgent = agents[Math.floor(Math.random() * agents.length)];
          const newTicket: SupportTicket = {
            id: ticketId,
            userId: currentUser.id,
            username: currentUser.username,
            title: 'MGM Live Direct Support',
            category: 'other',
            status: 'open',
            priority: 'high',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            agentName: randomAgent,
            messages: [
              {
                id: 'WELCOME_MSG',
                sender: 'support',
                senderName: randomAgent,
                text: `Hello ${currentUser.username}! Welcome to MGM Macau Direct Live Support. I am your assigned support representative. How can we help you today?`,
                timestamp: new Date().toISOString(),
                isRead: false
              }
            ]
          };
          await setDoc(ticketRef, newTicket);
        }
      } catch (err) {
        console.error('Error initializing direct chat:', err);
      }
    };

    initDirectChat();
  }, [currentUser, tickets]);

  // Clear typing timeout on ticket status change
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setRating(0);
    setFeedbackText('');
  }, [activeTicket?.status]);

  // Cleanup timers on component unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Smart scrolling effect
  useEffect(() => {
    if (!activeTicket) return;

    const container = chatContainerRef.current;
    
    // Smooth scroll down when message count increases or user sends message
    if (activeTicketMessagesLength > prevMessageLengthRef.current) {
      const isMyMessage = lastMessageSender === 'user';
      
      setTimeout(() => {
        if (container) {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
          if (isMyMessage || isNearBottom) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            });
          }
        } else {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
      prevMessageLengthRef.current = activeTicketMessagesLength;
    }
  }, [activeTicket, activeTicketMessagesLength, lastMessageSender]);

  if (!currentUser) {
    return (
      <div className="text-center py-16" id="support-not-logged">
        <h3 className="text-lg font-bold">Authentication Required</h3>
        <p className="text-xs text-slate-400 mt-1">Please sign in to access the direct support chat.</p>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !directTicketId) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTicketTyping(directTicketId, 'user', false);

    addMessageToTicket(directTicketId, chatInput, 'user');
    setChatInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (directTicketId) {
      setTicketTyping(directTicketId, 'user', true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTicketTyping(directTicketId, 'user', false);
      }, 1500);
    }
  };

  const handleAttachMock = (file: { name: string, type: string, url: string }) => {
    if (!directTicketId) return;
    addMessageToTicket(directTicketId, `Attached file: ${file.name}`, 'user', { name: file.name, url: file.url });
    setShowAttach(false);
  };

  const handleReopenChat = async () => {
    if (!directTicketId) return;
    try {
      const ticketRef = doc(db, 'tickets', directTicketId);
      await updateDoc(ticketRef, {
        status: 'open',
        rating: null,
        feedback: null,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error reopening chat:', err);
    }
  };

  // Filter messages based on search query
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
      <div className="w-full max-w-4xl mx-auto h-[calc(100vh-145px)] min-h-[600px] glass rounded-3xl overflow-hidden shadow-xl flex flex-col">
        
        {activeTicket ? (
          <div className="flex flex-col h-full min-h-0 bg-slate-950/20">
            
            {/* Chat Header */}
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
                      {activeTicket.agentName || 'MGM Support Concierge'}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-mono text-[8px] font-black tracking-wider uppercase">
                      Direct Support Active
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                    <span>Direct Chat Ref:</span> 
                    <span className="font-bold text-slate-300">#CHAT_{currentUser.username}</span>
                    <span className="text-slate-600">•</span>
                    <span>⭐ 4.9 Satisfaction • Response &lt; 2m</span>
                  </p>
                </div>
              </div>

              {/* Chat Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Message Search Toggle */}
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={`p-2 rounded-xl transition-all ${showSearch ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'}`}
                  title="Search Messages"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Optional Search Bar */}
            {showSearch && (
              <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter messages in this direct chat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white border-none outline-none flex-1 py-1"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Chat messages stream */}
            <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900 rounded-2xl text-center text-[10px] text-slate-400 font-mono shadow-inner">
                Direct encrypted conversation initiated • Live support representative online
              </div>

              {getFilteredMessages().map((m, idx, arr) => {
                const isMe = m.sender === 'user';
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
                        {m.senderName?.includes('Agent') || m.senderName?.includes('Concierge') ? '👩‍💻' : '🎧'}
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
                      
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed inline-block relative border transition-all duration-300 whitespace-pre-line ${
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

            {/* Chat Input or Post-Resolution Feedback Form */}
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
                        if (directTicketId) {
                          setTicketTyping(directTicketId, 'user', true);
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
                    className="p-2.5 rounded-xl glass glass-hover text-slate-400 hover:text-slate-600 transition-colors"
                    title="Attach documents"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  
                  <input
                    type="text"
                    placeholder="Type your support message..."
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
              /* Rated / Archived State */
              <div className="p-6 border-t border-slate-200/20 dark:border-white/5 bg-slate-900/40 text-center space-y-4">
                <div className="flex justify-center items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">SUPPORT INTERACTION ARCHIVED:</span>
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
                
                <div className="pt-2">
                  <button
                    onClick={handleReopenChat}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 mx-auto shadow-md"
                  >
                    <RotateCcw className="h-4 w-4" /> Start Live Chat Again
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-400 py-16 space-y-2">
            <div className="h-10 w-10 rounded-full border border-slate-800 animate-spin border-t-emerald-500" />
            <p className="text-xs font-mono">Initializing Premium Direct Chat...</p>
          </div>
        )}

      </div>
    </div>
  );
};
