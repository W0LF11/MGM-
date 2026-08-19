import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../context/firebase';
import { 
  Headphones, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Search, 
  Inbox, 
  X,
  FileCheck,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Folder,
  Camera,
  HardDrive,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { SupportTicket, SupportMessage } from '../types';
import { compressFileForChat } from '../utils/imageCompressor';
import { formatISTTime } from '../utils/TimeManager';

export const Support: React.FC = () => {
  const { 
    currentUser, 
    tickets, 
    addMessageToTicket, 
    resolveTicket,
    setTicketTyping,
    submitTicketRating,
    markTicketMessagesAsRead,
    setTickets
  } = usePlatform();

  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Feedback states
  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');

  // Attachment menu state
  const [showAttach, setShowAttach] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);

  // File input refs for real attachment options
  const chooseFileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photoLibraryInputRef = useRef<HTMLInputElement>(null);

  const mockDriveFiles = [
    { name: 'MGM_Deposit_Receipt_77A9BC.png', size: '1.2 MB', type: 'image', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80' },
    { name: 'Blockchain_Hash_Audit_Report.pdf', size: '420 KB', type: 'document', url: '#' },
    { name: 'VIP_Account_Verification_Proof.jpg', size: '2.8 MB', type: 'image', url: 'https://images.unsplash.com/photo-1540747737956-378724044432?auto=format&fit=crop&w=600&q=80' },
    { name: 'Bank_Transfer_Receipt_Statement.pdf', size: '890 KB', type: 'document', url: '#' }
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
        let existsOnRemote = false;
        try {
          const snap = await getDoc(ticketRef);
          existsOnRemote = snap.exists();
        } catch (e) {
          console.warn('[Direct Chat] Remote lookup warning:', e);
        }

        if (!existsOnRemote) {
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

          // Optimistically update context state immediately
          setTickets(prev => {
            if (prev.some(t => t.id === ticketId)) return prev;
            return [newTicket, ...prev];
          });

          try {
            await setDoc(ticketRef, newTicket);
          } catch (writeErr) {
            console.warn('[Direct Chat] Remote write saved to local state:', writeErr);
          }
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

  // Mark support messages as read when user views ticket
  useEffect(() => {
    if (activeTicket && activeTicket.messages && activeTicket.messages.length > 0 && currentUser) {
      const uId = currentUser.id;
      const hasUnreadSupportMsgs = activeTicket.messages.some(m => 
        m.sender === 'support' && (!m.isRead || m.status !== 'seen' || !(m.readBy || []).includes(uId) || !(m.readBy || []).includes('user'))
      );
      if (hasUnreadSupportMsgs) {
        markTicketMessagesAsRead(activeTicket.id, uId);
      }
    }
  }, [activeTicket?.id, activeTicket?.messages, currentUser?.id, markTicketMessagesAsRead]);

  // Diagnostic utility function within Support component to fetch and log full document structure of recent messages
  const diagnoseMessageReadByFlow = async () => {
    if (!directTicketId || !currentUser) {
      console.warn('[Support Diagnostic] Missing directTicketId or currentUser session');
      return;
    }
    try {
      const ticketRef = doc(db, 'tickets', directTicketId);
      const snapshot = await getDoc(ticketRef);
      if (!snapshot.exists()) {
        console.warn(`[Support Diagnostic] Document 'tickets/${directTicketId}' not found.`);
        return;
      }
      const data = snapshot.data() as SupportTicket;
      const sessionUid = currentUser.id;
      const recentMsgs = (data.messages || []).slice(-10);

      console.group(`🔍 [Support Diagnostic Utility] Full Document Structure Audit - Ticket ID: ${directTicketId}`);
      console.log('Session User UID:', sessionUid);
      console.log('Session User Email/Username:', currentUser.username || currentUser.email);
      console.log('Total Messages Count:', data.messages?.length || 0);
      console.log('Raw Document Data:', data);

      recentMsgs.forEach((msg, idx) => {
        const readByArray = msg.readBy || [];
        const isUidInReadBy = readByArray.includes(sessionUid);
        const isUserTokenInReadBy = readByArray.includes('user');
        const isUIConditionTriggered = isUidInReadBy || isUserTokenInReadBy;

        console.log(`Message #${idx + 1} [ID: ${msg.id}] Sender: ${msg.sender}`, {
          text: msg.text,
          timestamp: msg.timestamp,
          status: msg.status,
          isRead: msg.isRead,
          readByArray,
          sessionUidValidation: {
            sessionUid,
            containsSessionUid: isUidInReadBy,
            containsUserToken: isUserTokenInReadBy,
            uiConditionTriggered: isUIConditionTriggered
          }
        });

        if (msg.sender === 'support') {
          if (isUIConditionTriggered) {
            console.log(`✅ [VALIDATED] Support message ${msg.id} readBy array correctly contains recipient UID '${sessionUid}' or 'user'. UI condition message.readBy.includes(recipientId) triggered.`);
          } else {
            console.warn(`⚠️ [ISOLATED FAILURE] Support message ${msg.id} readBy array missing session UID '${sessionUid}'. Real-time snapshot pending.`);
          }
        }
      });
      console.groupEnd();
    } catch (err) {
      console.error('[Support Diagnostic] Diagnostic fetch error:', err);
    }
  };

  // Comprehensive trace of readBy logic & real-time message document snapshot updates
  useEffect(() => {
    if (!currentUser || !directTicketId) return;

    const ticketRef = doc(db, 'tickets', directTicketId);
    const recipientId = currentUser.id;

    const unsubscribe = onSnapshot(ticketRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() as SupportTicket;

      console.log(`[Support readBy Trace] Real-time message document snapshot update for ticket '${directTicketId}':`, {
        ticketId: data.id,
        messagesCount: data.messages?.length || 0,
        updatedAt: data.updatedAt
      });

      if (data.messages && data.messages.length > 0) {
        data.messages.forEach((msg: SupportMessage, idx: number) => {
          const readByArray = msg.readBy || [];
          const containsRecipientUid = readByArray.includes(recipientId);
          const containsUserToken = readByArray.includes('user');
          const isUIConditionMet = readByArray.includes(recipientId) || readByArray.includes('user');

          console.log(`[Support readBy Trace] Message #${idx + 1} (${msg.id}) [sender: ${msg.sender}]:`, {
            text: msg.text.substring(0, 40),
            readBy: readByArray,
            recipientId,
            containsRecipientUid,
            containsUserToken,
            uiConditionTriggered: isUIConditionMet,
            isRead: msg.isRead,
            status: msg.status
          });

          // Validate that the readBy array correctly receives the recipient's UID in real-time
          if (msg.sender === 'support') {
            if (isUIConditionMet) {
              console.log(`[Support readBy Trace] VALIDATED: Message ${msg.id} readBy array contains recipient UID '${recipientId}' (or 'user'). UI condition message.readBy.includes(recipientId) accurately triggered.`);
            } else {
              console.log(`[Support readBy Trace] PENDING: Message ${msg.id} has not yet received recipient UID '${recipientId}'.`);
            }
          }
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `tickets/${directTicketId}`);
    });

    return () => unsubscribe();
  }, [currentUser?.id, directTicketId]);

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

  const handleRealFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !directTicketId) return;

    try {
      const compressed = await compressFileForChat(file);
      if (compressed.url) {
        addMessageToTicket(
          directTicketId, 
          `Attached file: ${compressed.name}`, 
          'user', 
          { name: compressed.name, url: compressed.url }
        );
      }
    } catch (err) {
      console.error('[File Upload Error]', err);
    }

    // Reset input value so re-selecting same file works
    e.target.value = '';
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
    <div className={`w-full max-w-none ${isFullScreen ? 'fixed inset-0 z-[100] bg-slate-950 p-2 sm:p-4 overflow-hidden' : 'px-2 sm:px-4 lg:px-6 py-2'}`} id="support-panel-main">
      <div className={`w-full mx-auto glass shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
        isFullScreen 
          ? 'h-full rounded-2xl border border-slate-800 bg-slate-950/95' 
          : 'max-w-6xl xl:max-w-7xl h-[calc(100vh-125px)] min-h-[700px] rounded-3xl'
      }`}>
        
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
                {/* Diagnostic Trace Utility Button */}
                <button
                  type="button"
                  onClick={() => diagnoseMessageReadByFlow()}
                  className="px-2.5 py-2 rounded-xl transition-all text-slate-400 hover:text-emerald-400 bg-slate-900/40 border border-slate-800 text-xs font-mono flex items-center gap-1 cursor-pointer"
                  title="Run readBy & message snapshot diagnostics"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="hidden md:inline text-[10px] uppercase tracking-wider font-bold">Audit readBy</span>
                </button>

                {/* Message Search Toggle */}
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={`p-2 rounded-xl transition-all ${showSearch ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'}`}
                  title="Search Messages"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>

                {/* Full Screen Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold border cursor-pointer ${
                    isFullScreen 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md' 
                      : 'text-slate-300 hover:text-white bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                  title={isFullScreen ? "Exit Full Screen" : "Open Full Screen Chat"}
                >
                  {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{isFullScreen ? "Exit Full Screen" : "Full Screen"}</span>
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
                    className={`group flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} ${isSameSender ? 'mt-1' : 'mt-4'}`}
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

                    <div className={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] space-y-1 min-w-0 ${isMe ? 'text-right' : 'text-left'}`}>
                      {/* Sender Name header */}
                      {!isSameSender && (
                        <div className="text-[10px] text-slate-400 font-bold font-mono tracking-wider flex items-center gap-1.5 px-1">
                          {m.senderName}
                          {!isMe && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                      )}
                      
                      <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed inline-block max-w-full break-words [overflow-wrap:anywhere] whitespace-pre-wrap relative border transition-all duration-300 text-left ${
                        isMe 
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white border-emerald-400/20 shadow-md shadow-emerald-500/5 rounded-tr-none hover:shadow-lg' 
                          : 'bg-slate-100/70 dark:bg-slate-900/80 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 rounded-tl-none shadow-xs'
                      }`}>
                        {m.text}

                        {/* Render clickable uploaded file image preview */}
                        {m.fileUrl && (m.fileUrl.startsWith('data:image/') || m.fileName?.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-white/20 max-w-[240px] shadow-md bg-slate-950/60">
                            <img referrerPolicy="no-referrer" src={m.fileUrl} alt={m.fileName} className="w-full h-auto max-h-56 object-cover" />
                            <div className="p-1.5 bg-slate-950/90 text-[10px] text-center text-emerald-400 font-mono font-bold truncate">
                              {m.fileName}
                            </div>
                          </div>
                        )}

                        {m.fileUrl && !m.fileUrl.startsWith('data:image/') && !m.fileName?.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) && (
                          <div className="mt-2 p-2.5 bg-black/30 rounded-xl flex items-center gap-2 text-[10px] font-mono text-emerald-300 border border-emerald-500/20 shadow-inner">
                            <FileCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                            <span className="truncate max-w-[160px] font-bold">{m.fileName}</span>
                          </div>
                        )}
                      </div>

                      {/* Timestamp & Message Actions footer */}
                      <div className={`flex items-center gap-1.5 text-[9px] text-slate-400/80 font-mono mt-0.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span>{m.timestamp ? formatISTTime(m.timestamp) : ''}</span>
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

                {/* File Attachment Menu Popover - Matching Image 2 */}
                {showAttach && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setShowAttach(false)} 
                    />

                    <div className="absolute bottom-16 left-2 sm:left-4 bg-[#141c2b] dark:bg-[#121a28] border border-slate-700/80 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-2xl z-30 w-60 sm:w-64 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150 text-left">
                      
                      {/* Option 1: Google Drive */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttach(false);
                          setShowDriveModal(true);
                        }}
                        className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl sm:rounded-2xl hover:bg-slate-800/80 text-white transition-all cursor-pointer text-left active:scale-[0.98]"
                      >
                        <svg className="w-6 h-6 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 3h6l7 12h-6L9 3z" />
                          <path d="M2 15l7-12 4.5 8L7 22 2 15z" />
                          <path d="M22 15H10l-3.5 7h11L22 15z" />
                        </svg>
                        <span className="text-base font-medium text-white tracking-tight">Google Drive</span>
                      </button>

                      {/* Option 2: Choose File */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttach(false);
                          chooseFileInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl sm:rounded-2xl hover:bg-slate-800/80 text-white transition-all cursor-pointer text-left active:scale-[0.98]"
                      >
                        <Folder className="w-6 h-6 text-white shrink-0 stroke-[1.8]" />
                        <span className="text-base font-medium text-white tracking-tight">Choose File</span>
                      </button>

                      {/* Option 3: Take photo */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttach(false);
                          cameraInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl sm:rounded-2xl hover:bg-slate-800/80 text-white transition-all cursor-pointer text-left active:scale-[0.98]"
                      >
                        <Camera className="w-6 h-6 text-white shrink-0 stroke-[1.8]" />
                        <span className="text-base font-medium text-white tracking-tight">Take photo</span>
                      </button>

                      {/* Option 4: Photo Library */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttach(false);
                          photoLibraryInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl sm:rounded-2xl hover:bg-slate-800/80 text-white transition-all cursor-pointer text-left active:scale-[0.98]"
                      >
                        <svg className="w-6 h-6 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="6" width="15" height="14" rx="2.5" />
                          <path d="M7 2h13a2.5 2.5 0 0 1 2.5 2.5v12" />
                          <circle cx="6.5" cy="10.5" r="1.25" />
                          <path d="M2 17l4-4 3 3 4-5 4 5" />
                        </svg>
                        <span className="text-base font-medium text-white tracking-tight">Photo Library</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Hidden File Inputs for real user uploads */}
                <input
                  type="file"
                  ref={chooseFileInputRef}
                  onChange={handleRealFileChange}
                  className="hidden"
                  id="support-choose-file-input"
                />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handleRealFileChange}
                  className="hidden"
                  id="support-camera-input"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={photoLibraryInputRef}
                  onChange={handleRealFileChange}
                  className="hidden"
                  id="support-photo-library-input"
                />

                {/* Google Drive Selector Modal */}
                {showDriveModal && (
                  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#121a28] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 text-left">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <svg className="w-6 h-6 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 3h6l7 12h-6L9 3z" />
                            <path d="M2 15l7-12 4.5 8L7 22 2 15z" />
                            <path d="M22 15H10l-3.5 7h11L22 15z" />
                          </svg>
                          <div>
                            <h3 className="font-bold text-sm text-white">Google Drive</h3>
                            <p className="text-[10px] text-slate-400 font-mono">Select file from Google Cloud Storage</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowDriveModal(false)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Recent Cloud Documents & Receipts
                        </span>
                        <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                          {mockDriveFiles.map((file) => (
                            <button
                              key={file.name}
                              type="button"
                              onClick={() => {
                                if (directTicketId) {
                                  addMessageToTicket(
                                    directTicketId, 
                                    `Attached Google Drive file: ${file.name}`, 
                                    'user', 
                                    { name: file.name, url: file.url }
                                  );
                                }
                                setShowDriveModal(false);
                              }}
                              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-all cursor-pointer text-left group"
                            >
                              <div className="flex items-center gap-3 truncate">
                                {file.type === 'image' ? (
                                  <ImageIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                                ) : (
                                  <FileCheck className="h-5 w-5 text-blue-400 shrink-0" />
                                )}
                                <div className="truncate">
                                  <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate">{file.name}</p>
                                  <p className="text-[9px] font-mono text-slate-400">{file.size} • Google Drive Cloud</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg shrink-0">
                                Attach
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDriveModal(false);
                            chooseFileInputRef.current?.click();
                          }}
                          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                        >
                          Upload Local File to Drive
                        </button>
                      </div>
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
