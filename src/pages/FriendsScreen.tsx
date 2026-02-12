import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UserPlus, MessageCircle, Swords, MoreVertical,
  X, Check, Clock, TrendingUp, Send, ArrowLeft
} from 'lucide-react';
import { MobileLayout } from '@/components/MobileLayout';
import { useGameStore, Friend } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { RANKS } from '@/systems/progression';
import { getDefaultCountry } from '@/systems/countries';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isMe: boolean;
}

interface ChatRoom {
  friendId: string;
  messages: Message[];
}

export function FriendsScreen() {
  const { friends, pendingInvites, sendInvite, removeFriend, addFriend, user } = useGameStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');

  // Chat state
  const [chatFriend, setChatFriend] = useState<Friend | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const onlineFriends = friends.filter(f => f.online);
  const offlineFriends = friends.filter(f => !f.online);

  const filteredOnline = onlineFriends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOffline = offlineFriends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatRooms, chatFriend]);

  const handleInvite = (friendId: string) => {
    sendInvite(friendId);
    setSelectedFriend(null);
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

    // Create chat room if doesn't exist
    if (!chatRooms.find(room => room.friendId === friend.id)) {
      // Add some sample welcome messages
      const welcomeMessages: Message[] = [
        {
          id: '1',
          senderId: friend.id,
          text: `Hey ${user.name}! 👋`,
          timestamp: new Date(Date.now() - 60000),
          isMe: false,
        },
        {
          id: '2',
          senderId: friend.id,
          text: "Ready for a game of chess?",
          timestamp: new Date(Date.now() - 30000),
          isMe: false,
        },
      ];

      setChatRooms(prev => [...prev, {
        friendId: friend.id,
        messages: welcomeMessages,
      }]);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !chatFriend) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      text: messageInput.trim(),
      timestamp: new Date(),
      isMe: true,
    };

    setChatRooms(prev => prev.map(room => {
      if (room.friendId === chatFriend.id) {
        return {
          ...room,
          messages: [...room.messages, newMessage],
        };
      }
      return room;
    }));

    setMessageInput('');

    // Simulate friend response after a delay
    if (chatFriend.online) {
      setTimeout(() => {
        const responses = [
          "That's great! 😊",
          "Let's play soon!",
          "Good game last time!",
          "I've been practicing my openings",
          "Ready when you are! ♟️",
          "Sure thing!",
          "Sounds good!",
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        const replyMessage: Message = {
          id: (Date.now() + 1).toString(),
          senderId: chatFriend.id,
          text: randomResponse,
          timestamp: new Date(),
          isMe: false,
        };

        setChatRooms(prev => prev.map(room => {
          if (room.friendId === chatFriend.id) {
            return {
              ...room,
              messages: [...room.messages, replyMessage],
            };
          }
          return room;
        }));
      }, 1000 + Math.random() * 2000);
    }
  };

  const getCurrentChatMessages = () => {
    if (!chatFriend) return [];
    const room = chatRooms.find(r => r.friendId === chatFriend.id);
    return room?.messages || [];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const FriendCard = ({ friend }: { friend: Friend }) => {
    const isPending = pendingInvites.includes(friend.id);
    const rankInfo = RANKS[friend.rank];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-white/5 rounded-2xl p-4 flex items-center gap-3 shadow-sm dark:shadow-none"
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl">
            {friend.avatar}
          </div>
          {friend.online && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-indigo-950" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm">{friend.country.flag}</span>
            <p className="text-gray-900 dark:text-white font-medium">{friend.name}</p>
            <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${rankInfo.color}20`, color: rankInfo.color }}>
              <span>{rankInfo.icon}</span>
              <span>Lv.{friend.level}</span>
            </div>
          </div>
          <p className={cn(
            'text-sm',
            friend.online ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-white/40'
          )}>
            {friend.online ? 'Online' : friend.lastSeen}
          </p>
        </div>

        <div className="flex gap-2">
          {friend.online && !isPending && (
            <button
              onClick={() => handleInvite(friend.id)}
              className="p-3 bg-green-500/20 rounded-xl text-green-400 hover:bg-green-500/30 transition-colors"
            >
              <Swords size={20} />
            </button>
          )}
          {isPending && (
            <div className="px-3 py-2 bg-amber-500/20 rounded-xl text-amber-400 text-sm flex items-center gap-2">
              <Clock size={14} />
              Pending
            </div>
          )}
          <button
            onClick={() => setSelectedFriend(friend)}
            className="p-3 bg-white/5 rounded-xl text-white/40 hover:bg-white/10 transition-colors"
          >
            <MoreVertical size={20} />
          </button>
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
            className="p-2 text-white/70 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
        }
      >
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="px-4 pb-4 flex items-center gap-3 border-b border-white/10">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl">
                {chatFriend.avatar}
              </div>
              {chatFriend.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-indigo-950" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>{chatFriend.country.flag}</span>
                <p className="text-white font-bold">{chatFriend.name}</p>
              </div>
              <p className={cn(
                'text-xs',
                chatFriend.online ? 'text-green-400' : 'text-white/40'
              )}>
                {chatFriend.online ? 'Online now' : chatFriend.lastSeen}
              </p>
            </div>
            <button
              onClick={() => handleInvite(chatFriend.id)}
              className="p-3 bg-green-500/20 rounded-xl text-green-400 hover:bg-green-500/30 transition-colors"
            >
              <Swords size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                  <MessageCircle size={28} className="text-white/30" />
                </div>
                <p className="text-white/40">No messages yet</p>
                <p className="text-white/30 text-sm">Say hello! 👋</p>
              </div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex",
                    message.isMe ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[80%] px-4 py-2.5 rounded-2xl",
                    message.isMe
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-sm"
                      : "bg-white/10 text-white rounded-bl-sm"
                  )}>
                    <p className="text-sm">{message.text}</p>
                    <p className={cn(
                      "text-[10px] mt-1",
                      message.isMe ? "text-white/70" : "text-white/40"
                    )}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className={cn(
                  "p-3 rounded-xl transition-colors",
                  messageInput.trim()
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    : "bg-white/10 text-white/30"
                )}
              >
                <Send size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title="Friends"
      rightAction={
        <button
          onClick={() => setShowAddFriend(true)}
          className="p-2 text-amber-400"
        >
          <UserPlus size={24} />
        </button>
      }
    >
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Online Friends */}
        {filteredOnline.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <h3 className="text-gray-600 dark:text-white/60 text-sm font-medium uppercase tracking-wider">
                Online ({filteredOnline.length})
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
          <div>
            <h3 className="text-gray-600 dark:text-white/60 text-sm font-medium uppercase tracking-wider mb-3">
              Offline ({filteredOffline.length})
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
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
              <UserPlus size={32} className="text-white/40" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">No Friends Yet</h3>
            <p className="text-white/40 mb-6">Add friends to play chess together!</p>
            <button
              onClick={() => setShowAddFriend(true)}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white font-bold"
            >
              Add Friend
            </button>
          </div>
        )}

        {/* Leaderboard Preview */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-amber-400" size={24} />
            <h3 className="text-white font-bold">Leaderboard</h3>
          </div>
          <div className="space-y-3">
            {friends.slice().sort((a, b) => b.level - a.level).slice(0, 3).map((friend, i) => (
              <div key={friend.id} className="flex items-center gap-3">
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
                  i === 0 ? 'bg-amber-400 text-black' :
                    i === 1 ? 'bg-gray-300 text-black' :
                      'bg-amber-700 text-white'
                )}>
                  {i + 1}
                </span>
                <span className="text-xl">{friend.avatar}</span>
                <span className="text-sm">{friend.country.flag}</span>
                <span className="text-white flex-1">{friend.name}</span>
                <span className="text-amber-400 font-bold">Lv.{friend.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Friend Options Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedFriend && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[9999]"
              onClick={() => setSelectedFriend(null)}
            >
              <motion.div
                initial={{ y: 200 }}
                animate={{ y: 0 }}
                exit={{ y: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-indigo-900 rounded-t-3xl p-6 w-full max-w-lg space-y-4 pb-10"
              >
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl">
                    {selectedFriend.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedFriend.country.flag}</span>
                      <h3 className="text-xl font-bold text-white">{selectedFriend.name}</h3>
                    </div>
                    <p className="text-amber-400">{selectedFriend.rank} • Level {selectedFriend.level}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleInvite(selectedFriend.id)}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
                >
                  <Swords size={20} />
                  Challenge to Play
                </button>

                <button
                  onClick={() => openChat(selectedFriend)}
                  className="w-full py-4 bg-white/10 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} />
                  Send Message
                </button>

                <button
                  onClick={() => {
                    removeFriend(selectedFriend.id);
                    setSelectedFriend(null);
                  }}
                  className="w-full py-4 bg-red-500/20 rounded-2xl text-red-400 font-bold flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Remove Friend
                </button>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddFriend(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-indigo-900 rounded-3xl p-6 w-full max-w-sm space-y-4"
            >
              <h2 className="text-2xl font-bold text-white text-center">Add Friend</h2>

              <input
                type="text"
                placeholder="Enter username"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400"
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddFriend(false)}
                  className="flex-1 py-3 bg-white/10 rounded-xl text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFriend}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  Add
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
