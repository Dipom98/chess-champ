import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Coins, TrendingUp, TrendingDown, ChevronLeft, ChevronRight,
  Gift, Swords, Trophy, Flame, CreditCard
} from 'lucide-react';
import { MobileLayout } from '@/components/MobileLayout';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { Transaction, TransactionType } from '@/systems/types';

const TRANSACTIONS_PER_PAGE = 15;

export function WalletScreen() {
  const { user } = useGameStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const transactions = user.wallet.transactions;
  
  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'credit') return t.amount > 0;
    if (filter === 'debit') return t.amount < 0;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + TRANSACTIONS_PER_PAGE);

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'pve_win':
      case 'pvp_win':
        return { icon: Trophy, color: 'text-green-400 bg-green-500/20' };
      case 'pve_loss':
      case 'pvp_loss':
        return { icon: Swords, color: 'text-red-400 bg-red-500/20' };
      case 'daily_bonus':
      case 'streak_bonus':
        return { icon: Flame, color: 'text-amber-400 bg-amber-500/20' };
      case 'gift_reward':
        return { icon: Gift, color: 'text-purple-400 bg-purple-500/20' };
      case 'level_up_reward':
        return { icon: TrendingUp, color: 'text-blue-400 bg-blue-500/20' };
      case 'season_reward':
        return { icon: Trophy, color: 'text-yellow-400 bg-yellow-500/20' };
      default:
        return { icon: CreditCard, color: 'text-gray-400 bg-gray-500/20' };
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const TransactionItem = ({ transaction, index }: { transaction: Transaction; index: number }) => {
    const { icon: Icon, color } = getTransactionIcon(transaction.type);
    const isCredit = transaction.amount > 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="flex items-center gap-3 p-3 border-b border-white/5 last:border-0"
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{transaction.description}</p>
          <p className="text-white/40 text-xs">{formatDate(transaction.timestamp)}</p>
        </div>
        <div className="text-right">
          <p className={cn(
            "font-bold",
            isCredit ? "text-green-400" : "text-red-400"
          )}>
            {isCredit ? '+' : ''}{transaction.amount.toLocaleString()}
          </p>
          <p className="text-white/30 text-xs">
            Bal: {transaction.balance.toLocaleString()}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <MobileLayout title="Wallet" showBack>
      <div className="p-4 space-y-5 pb-8">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Coins size={20} className="text-white/80" />
              <span className="text-white/80 text-sm">Total Balance</span>
            </div>
            <p className="text-4xl font-bold text-white mb-4">
              {user.wallet.balance.toLocaleString()} 🪙
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/20 rounded-xl p-2 text-center backdrop-blur-sm">
                <p className="text-lg font-bold text-white">{user.wallet.totalEarned.toLocaleString()}</p>
                <p className="text-[10px] text-white/70">Total Earned</p>
              </div>
              <div className="bg-white/20 rounded-xl p-2 text-center backdrop-blur-sm">
                <p className="text-lg font-bold text-white">{user.wallet.totalSpent.toLocaleString()}</p>
                <p className="text-[10px] text-white/70">Total Spent</p>
              </div>
              <div className="bg-white/20 rounded-xl p-2 text-center backdrop-blur-sm">
                <p className="text-lg font-bold text-white">{user.wallet.lockedBalance.toLocaleString()}</p>
                <p className="text-[10px] text-white/70">Locked</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-white/60 text-sm">This Week</span>
            </div>
            <p className="text-green-400 font-bold text-xl">
              +{Math.floor(user.wallet.totalEarned * 0.15).toLocaleString()}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-red-400" />
              <span className="text-white/60 text-sm">This Week</span>
            </div>
            <p className="text-red-400 font-bold text-xl">
              -{Math.floor(user.wallet.totalSpent * 0.12).toLocaleString()}
            </p>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'credit', 'debit'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setCurrentPage(1); }}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-medium transition-all capitalize',
                filter === f
                  ? f === 'credit' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : f === 'debit'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/5 text-white/40'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-white/50 text-sm font-medium uppercase tracking-wider">
              Transaction History
            </h3>
            <span className="text-white/30 text-xs">
              {filteredTransactions.length} transactions
            </span>
          </div>

          {paginatedTransactions.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Coins className="mx-auto text-white/30 mb-3" size={40} />
              <p className="text-white/40">No transactions found</p>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              {paginatedTransactions.map((transaction, index) => (
                <TransactionItem 
                  key={transaction.id} 
                  transaction={transaction} 
                  index={index}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  currentPage === 1 
                    ? "text-white/20" 
                    : "text-white/60 hover:bg-white/10"
                )}
              >
                <ChevronLeft size={20} />
              </motion.button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-sm font-medium transition-all",
                        currentPage === pageNum
                          ? "bg-amber-500 text-white"
                          : "text-white/50 hover:bg-white/10"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  currentPage === totalPages 
                    ? "text-white/20" 
                    : "text-white/60 hover:bg-white/10"
                )}
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
