import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UserPlus, MessageCircle, Swords, MoreVertical,
  X, Check, Clock, TrendingUp, Send, ArrowLeft, Users, Sparkles
} from 'lucide-react';
import { MobileLayout } from '@/components/MobileLayout';
import { useGameStore, type Friend, type ChatMessage } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { RANKS } from '@/systems/progression';
import { getDefaultCountry } from '@/systems/countries';

export function FriendsScreen() {
  const {
    friends,
    pendingInvites,
    removeFriend,
    addFriend,
    user,
    chatRooms,
    incomingChallenges,
    sendMessageAction,
    sendChallengeAction,
    respondToChallenge
  } = useGameStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');

  // Chat state
  const [chatFriend, setChatFriend] = useState<Friend | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Discovery state
  const [activeTab, setActiveTab] = useState<'friends' | 'discover'>('friends');

  const onlineFriends = friends.filter(f => f.online);
  const offlineFriends = friends.filter(f => !f.online);

  const filteredOnline = onlineFriends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOffline = offlineFriends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Suggested players (Discovery)
  const suggestedPlayers: Friend[] = [
    { id: 'S1', name: 'Grandmaster_X', avatar: '🧙‍♂️', online: true, level: 92, rank: 'Grandmaster', country: { code: 'IS', name: 'Iceland', flag: '🇮🇸' } },
    { id: 'S2', name: 'ChessQueen', avatar: '👸', online: true, level: 65, rank: 'Elite', country: { code: 'FR', name: 'France', flag: '🇫🇷' } },
    { id: 'S3', name: 'Knight_Rider', avatar: '♞', online: true, level: 42, rank: 'Squire', country: { code: 'DE', name: 'Germany', flag: '🇩🇪' } },
  ];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatRooms, chatFriend]);

  const handleInvite = (friendId: string) => {
    sendChallengeAction(friendId);
    setSelectedFriend(null);
  };

  const handleAddFriendFromDiscovery = (friend: Friend) => {
    addFriend({ ...friend, id: Date.now().toString(), online: false, lastSeen: 'Added from discovery' });
  };

  const handleAddFriend = () => {
    if (newFriendName.trim()) {
      const newFriend: Friend = {
        id: Date.now().toString(),
        name: newFriendName.trim(),
        avatar: '👤',
        online: false,
        lastSeen: 'Just added',
        level: 1,
        rank: 'Pawn',
        country: getDefaultCountry(),
      };
      addFriend(newFriend);
      setNewFriendName('');
      setShowAddFriend(false);
    }
  };

  const openChat = (friend: Friend) => {
    setChatFriend(friend);
    setSelectedFriend(null);
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !chatFriend) return;
    try {
      await sendMessageAction(chatFriend.id, messageInput.trim());
      setMessageInput('');
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const getCurrentChatMessages = () => {
    if (!chatFriend) return [];
    return chatRooms[chatFriend.id] || [];
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const FriendCard = ({ friend, isDiscovery = false }: { friend: Friend, isDiscovery?: boolean }) => {
    const isPending = pendingInvites.includes(friend.id);
    const rankInfo = RANKS[friend.rank];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all"
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/50 to-purple-600/50 flex items-center justify-center text-2xl border border-white/10">
            {friend.avatar}
          </div>
          {friend.online && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-indigo-950 shadow-lg" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-sm shrink-0">{friend.country.flag}</span>
            <p className="text-white font-bold truncate">{friend.name}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold" style={{ backgroundColor: `${rankInfo.color}20`, color: rankInfo.color, border: `1px solid ${rankInfo.color}30` }}>
              <span>{rankInfo.icon}</span>
              <span>Lv.{friend.level}</span>
            </div>
            <span className={cn(
              'text-[10px] font-medium uppercase tracking-tight',
              friend.online ? 'text-green-400' : 'text-white/30'
            )}>
              {friend.online ? 'Online' : friend.lastSeen}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {isDiscovery ? (
            <button
              onClick={() => handleAddFriendFromDiscovery(friend)}
              className="tap-target bg-amber-500/20 rounded-xl text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              <UserPlus size={20} />
            </button>
          ) : (
            <>
              {friend.online && !isPending && (
                <button
                  onClick={() => handleInvite(friend.id)}
                  className="tap-target bg-green-500/20 rounded-xl text-green-400 hover:bg-green-500/30 transition-colors"
                >
                  <Swords size={20} />
                </button>
              )}
              {isPending && (
                <div className="tap-target px-3 bg-amber-500/20 rounded-xl text-amber-400 text-xs flex flex-col items-center justify-center gap-0.5 border border-amber-500/20">
                  <Clock size={14} />
                  <span>Pending</span>
                </div>
              )}
              <button
                onClick={() => setSelectedFriend(friend)}
                className="tap-target bg-white/5 rounded-xl text-white/40 hover:bg-white/10 transition-colors"
              >
                <MoreVertical size={20} />
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  // Chat View
  if (chatFriend) {
    const messages = getCurrentChatMessages();

    return (
      <MobileLayout
        title=""
        leftAction={
          <button
            onClick={() => setChatFriend(null)}
            className="tap-target text-white/70 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
        }
      >
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="px-4 pb-4 flex items-center gap-3 border-b border-white/5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg">
                {chatFriend.avatar}
              </div>
              {chatFriend.online && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-indigo-950" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="shrink-0">{chatFriend.country.flag}</span>
                <p className="text-white font-bold truncate">{chatFriend.name}</p>
              </div>
              <p className={cn(
                'text-[10px] font-medium uppercase tracking-wider',
                chatFriend.online ? 'text-green-400' : 'text-white/40'
              )}>
                {chatFriend.online ? 'Online now' : chatFriend.lastSeen}
              </p>
            </div>
            <button
              onClick={() => handleInvite(chatFriend.id)}
              className="tap-target bg-green-500/20 rounded-xl text-green-400 hover:bg-green-500/30 transition-colors"
            >
              <Swords size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center shadow-inner">
                  <MessageCircle size={28} className="text-white/30" />
                </div>
                <p className="text-white/40 font-bold">Start a conversation</p>
                <p className="text-white/20 text-xs">Messages are private and secure</p>
              </div>
            ) : (
              messages.map((message: ChatMessage) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "flex",
                    message.sender_id === user.id ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[80%] px-4 py-3 rounded-2xl shadow-sm",
                    message.sender_id === user.id
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-sm"
                      : "bg-white/10 text-white rounded-bl-sm border border-white/5"
                  )}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={cn(
                      "text-[8px] mt-1 font-medium uppercase tracking-widest",
                      message.sender_id === user.id ? "text-white/70" : "text-white/40"
                    )}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 bg-black/20 backdrop-blur-lg border-t border-white/5 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400/50 transition-all shadow-inner"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className={cn(
                  "tap-target px-4 rounded-2xl transition-all shadow-lg",
                  messageInput.trim()
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                    : "bg-white/5 text-white/20"
                )}
              >
                <Send size={18} />
              </motion.button>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title="Social"
      rightAction={
        <button
          onClick={() => setShowAddFriend(true)}
          className="tap-target text-amber-400"
        >
          <UserPlus size={24} />
        </button>
      }
    >
      <div className="p-4 space-y-6">
        {/* Challenge received banner */}
        <AnimatePresence>
          {incomingChallenges.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl shrink-0">
                  {incomingChallenges[0].sender_avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">Challenge from {incomingChallenges[0].sender_name}</p>
                  <p className="text-white/40 text-[10px]">Ready for a quick match?</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondToChallenge(incomingChallenges[0].id, 'rejected')}
                    className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white/60"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => respondToChallenge(incomingChallenges[0].id, 'accepted')}
                    className="p-2 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('friends')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === 'friends' ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
            )}
          >
            My Friends
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === 'discover' ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
            )}
          >
            Discover
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input
            type="text"
            placeholder={activeTab === 'friends' ? "Search your friends..." : "Search players..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 transition-all shadow-inner"
          />
        </div>

        {activeTab === 'friends' ? (
          <div className="space-y-6">
            {/* Online Friends */}
            {filteredOnline.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white/50 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Online • {filteredOnline.length}
                  </h3>
                </div>
                <div className="space-y-3">
                  {filteredOnline.map(friend => (
                    <FriendCard key={friend.id} friend={friend} />
                  ))}
                </div>
              </div>
            )}

            {/* Offline Friends */}
            {filteredOffline.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
                  Offline • {filteredOffline.length}
                </h3>
                <div className="space-y-3">
                  {filteredOffline.map(friend => (
                    <FriendCard key={friend.id} friend={friend} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {friends.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 px-8 glass rounded-3xl border border-dashed border-white/10"
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full flex items-center justify-center text-amber-500/50">
                  <Users size={48} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Friends Connected</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-8">
                  Chess is better with friends! Search for other players or invite them to a game.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="w-full py-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl text-white font-extrabold shadow-lg shadow-amber-500/20"
                  >
                    Discover Players
                  </button>
                  <button
                    onClick={() => setShowAddFriend(true)}
                    className="w-full py-4 glass rounded-2xl text-white font-bold border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    Add by ID
                  </button>
                </div>
              </motion.div>
            )}

            {/* Mini Leaderboard Preview */}
            {friends.length > 0 && (
              <div className="glass rounded-3xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <TrendingUp className="text-amber-400" size={18} />
                    Friends Ranking
                  </h3>
                </div>
                <div className="space-y-4">
                  {friends.slice().sort((a, b) => b.level - a.level).slice(0, 3).map((friend, i) => (
                    <div key={friend.id} className="flex items-center gap-3">
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0',
                        i === 0 ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20' :
                          i === 1 ? 'bg-slate-300 text-black shadow-lg shadow-slate-500/10' :
                            'bg-amber-700/50 text-white'
                      )}>
                        #{i + 1}
                      </div>
                      <span className="text-lg">{friend.avatar}</span>
                      <span className="text-white font-medium flex-1 truncate">{friend.name}</span>
                      <div className="text-right">
                        <span className="text-amber-400 font-black text-xs">Level {friend.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                Recommended Players
              </h3>
            </div>
            <div className="space-y-3">
              {suggestedPlayers.map(player => (
                <FriendCard key={player.id} friend={player} isDiscovery />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 glass rounded-2xl border border-amber-500/10 bg-amber-500/5"
            >
              <h4 className="text-amber-400 font-bold text-sm mb-2 flex items-center gap-2">
                <Sparkles size={14} />
                Matchmaking Tip
              </h4>
              <p className="text-white/40 text-[11px] leading-relaxed">
                Playing against higher-level players earns you more XP and rank points if you win or draw!
              </p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Friend Options Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedFriend && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-6"
              onClick={() => setSelectedFriend(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="glass rounded-[2rem] p-8 w-full max-w-sm space-y-6 border border-white/10 shadow-2xl relative overflow-hidden"
              >
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />

                <div className="text-center relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl shadow-xl mx-auto mb-4 border border-white/10">
                    {selectedFriend.avatar}
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-xl">{selectedFriend.country.flag}</span>
                    <h3 className="text-2xl font-black text-white tracking-tight">{selectedFriend.name}</h3>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <span className="text-amber-400 font-bold uppercase tracking-widest text-[10px]">
                      {selectedFriend.rank}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="text-white/50 text-[10px] font-medium uppercase">
                      Level {selectedFriend.level}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 relative z-10 pt-2">
                  <button
                    onClick={() => handleInvite(selectedFriend.id)}
                    className="w-full py-4 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl text-white font-black flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all"
                  >
                    <Swords size={20} />
                    Challenge Player
                  </button>

                  <button
                    onClick={() => openChat(selectedFriend)}
                    className="w-full py-4 glass rounded-2xl text-white font-bold flex items-center justify-center gap-3 border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all"
                  >
                    <MessageCircle size={20} />
                    Send Message
                  </button>

                  <button
                    onClick={() => {
                      removeFriend(selectedFriend.id);
                      setSelectedFriend(null);
                    }}
                    className="w-full py-3 text-rose-400/70 font-bold text-sm flex items-center justify-center gap-2 hover:text-rose-400 transition-all pt-2"
                  >
                    <X size={16} />
                    Remove Friend
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[10000] p-6"
            onClick={() => setShowAddFriend(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-[2rem] p-8 w-full max-w-sm space-y-6 border border-white/10 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500">
                  <UserPlus size={32} />
                </div>
                <h2 className="text-2xl font-black text-white">Join the Community</h2>
                <p className="text-white/40 text-xs mt-2">Enter your friend's unique Player ID</p>
              </div>

              <input
                type="text"
                placeholder="e.g. Grandmaster#123"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition-all font-mono"
                autoFocus
              />

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAddFriend}
                  className="w-full py-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                >
                  <Check size={20} />
                  Add Friend
                </button>
                <button
                  onClick={() => setShowAddFriend(false)}
                  className="w-full py-3 text-white/30 font-bold hover:text-white/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
