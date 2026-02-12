import { MobileLayout } from '@/components/MobileLayout';
import { Mail, MessageCircle, HelpCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function SupportScreen() {
    const [copied, setCopied] = useState(false);
    const email = "Support@Dipomdutta.com";

    const handleCopy = () => {
        navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <MobileLayout title="Support" showBack>
            <div className="p-4 space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent" />
                    <div className="relative z-10">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
                            <HelpCircle size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">How can we help?</h2>
                        <p className="text-white/70 text-sm">
                            We're here to help you with any questions or issues you might have.
                        </p>
                    </div>
                </div>

                {/* Contact Email */}
                <div className="space-y-3">
                    <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider px-1">
                        Contact Support
                    </h3>
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="glass rounded-2xl p-5"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <Mail size={24} className="text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold">Email Support</h4>
                                <p className="text-white/50 text-sm">Response within 24 hours</p>
                            </div>
                        </div>

                        <div className="bg-black/20 rounded-xl p-3 flex items-center justify-between gap-2 border border-white/5">
                            <code className="text-amber-400 font-mono text-sm break-all">{email}</code>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleCopy}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
                            >
                                <AnimatePresence mode='wait'>
                                    {copied ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <Check size={18} className="text-green-400" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="copy"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <Copy size={18} className="text-white/50" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>

                        <a
                            href={`mailto:${email}`}
                            className="mt-4 w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <MessageCircle size={18} />
                            Send Email
                        </a>
                    </motion.div>
                </div>

                {/* FAQs */}
                <div className="space-y-3">
                    <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider px-1">
                        Common Questions
                    </h3>
                    <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
                        {[
                            "How do I restore my purchases?",
                            "Why can't I play online?",
                            "How is my rating calculated?",
                            "Is the game truly offline?"
                        ].map((question, i) => (
                            <button
                                key={i}
                                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                            >
                                <span className="text-white/80 font-medium text-sm">{question}</span>
                                <ExternalLink size={16} className="text-white/30" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
}
