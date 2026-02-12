import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Volume2, Smartphone, Eye, Crown,
  Palette, Moon, HelpCircle, ChevronRight,
  Check, X, Mail, Globe, User, Trash2, Star, Lock,
  Camera, Image, FileText, Shield, Headphones
} from 'lucide-react';
import { MobileLayout } from '@/components/MobileLayout';
import { useGameStore, BOARD_THEMES } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { COUNTRIES, DEFAULT_AVATARS } from '@/systems/countries';
import { Gender, Country } from '@/systems/types';
import { RANKS } from '@/systems/progression';
import { BoardTheme } from '@/store/gameStore';

export function SettingsScreen() {
  const navigate = useNavigate();
  const { settings, updateSettings, user, updateProfile, updateUser } = useGameStore();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editGender, setEditGender] = useState<Gender>(user.gender);
  const [editCountry, setEditCountry] = useState<Country>(user.country);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [editProfilePicture, setEditProfilePicture] = useState<string | null>(user.customProfilePicture || null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPremiumThemeAlert, setShowPremiumThemeAlert] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditProfilePicture(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setEditProfilePicture(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const avatarOptions = DEFAULT_AVATARS[editGender] || DEFAULT_AVATARS.prefer_not_to_say;

  // Separate regular and premium themes
  const regularThemes = Object.entries(BOARD_THEMES)
    .filter(([_, config]) => !config.isPremium)
    .map(([id, config]) => ({ id, ...config }));

  const premiumThemes = Object.entries(BOARD_THEMES)
    .filter(([_, config]) => config.isPremium)
    .map(([id, config]) => ({ id, ...config }));

  const genderOptions: { value: Gender; label: string; icon: string }[] = [
    { value: 'male', label: 'Male', icon: '👨' },
    { value: 'female', label: 'Female', icon: '👩' },
    { value: 'other', label: 'Other', icon: '🧑' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: '👤' },
  ];

  const handleSaveProfile = () => {
    updateProfile(editName, editEmail, editGender, editCountry, editAvatar);
    updateUser({ customProfilePicture: editProfilePicture });
    setShowEditProfile(false);
  };

  const handleGenderChange = (gender: Gender) => {
    setEditGender(gender);
    // Set default avatar for new gender
    const defaultAvatars = DEFAULT_AVATARS[gender];
    if (defaultAvatars && !defaultAvatars.includes(editAvatar)) {
      setEditAvatar(defaultAvatars[0]);
    }
  };

  const handleThemeSelect = (themeId: string) => {
    const theme = BOARD_THEMES[themeId as BoardTheme];
    if (theme.isPremium && !settings.isPremium) {
      setShowPremiumThemeAlert(true);
      return;
    }
    updateSettings({ boardTheme: themeId as BoardTheme });
  };

  const handleSubscribe = () => {
    // Simulate subscription - in real app this would integrate with payment
    const expiryDate = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    updateSettings({ isPremium: true, premiumExpiry: expiryDate });
    setShowSubscription(false);
  };

  // Apply dark mode effect
  useEffect(() => {
    if (settings.darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [settings.darkMode]);

  const handleResetData = () => {
    // Clear all localStorage
    localStorage.clear();
    // Navigate to welcome using hash router format and reload
    window.location.hash = '#/welcome';
    window.location.reload();
  };

  const rankInfo = RANKS[user.rank];

  interface SettingToggleProps {
    icon: React.ElementType;
    label: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
  }

  const SettingToggle = ({ icon: Icon, label, description, value, onChange }: SettingToggleProps) => (
    <div className="flex items-center gap-4 py-4 border-b border-white/5 last:border-0">
      <div className="w-11 h-11 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center">
        <Icon size={20} className="text-white/70" />
      </div>
      <div className="flex-1">
        <p className="text-white font-medium">{label}</p>
        <p className="text-white/40 text-xs">{description}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(!value)}
        className={cn(
          'w-14 h-8 rounded-full transition-all relative',
          value ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20' : 'bg-white/10'
        )}
      >
        <motion.div
          animate={{ x: value ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
        />
      </motion.button>
    </div>
  );

  const SettingLink = ({ icon: Icon, label, value, onClick, danger, premium }: {
    icon: React.ElementType;
    label: string;
    value?: string;
    onClick?: () => void;
    danger?: boolean;
    premium?: boolean;
  }) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 py-4 border-b border-white/5 last:border-0 w-full text-left hover:bg-white/5 -mx-4 px-4 transition-colors",
        danger && "hover:bg-red-500/10"
      )}
    >
      <div className={cn(
        "w-11 h-11 rounded-xl flex items-center justify-center",
        danger ? "bg-red-500/20" : premium ? "bg-gradient-to-br from-amber-500/30 to-orange-500/30" : "bg-gradient-to-br from-white/10 to-white/5"
      )}>
        <Icon size={20} className={danger ? "text-red-400" : premium ? "text-amber-400" : "text-white/70"} />
      </div>
      <div className="flex-1">
        <p className={cn("font-medium", danger ? "text-red-400" : premium ? "text-amber-400" : "text-white")}>{label}</p>
      </div>
      {value && <span className="text-amber-400 text-sm font-medium">{value}</span>}
      <ChevronRight size={18} className={danger ? "text-red-400/50" : "text-white/30"} />
    </motion.button>
  );

  return (
    <MobileLayout title="Settings">
      <div className="p-4 space-y-6 pb-8">
        {/* Premium Banner */}
        {!settings.isPremium && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSubscription(true)}
            className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-4 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Crown size={28} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white font-bold text-lg">Upgrade to Premium</h3>
                <p className="text-white/80 text-sm">Unlock 5 exclusive themes & more!</p>
                <p className="text-white font-bold mt-1">$1.99/month</p>
              </div>
              <ChevronRight className="text-white/70" size={24} />
            </div>
          </motion.button>
        )}

        {/* Premium Badge if subscribed */}
        {settings.isPremium && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Crown size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-amber-400 font-bold">Premium Member</h3>
                <p className="text-white/50 text-sm">
                  {settings.premiumExpiry
                    ? `Expires: ${new Date(settings.premiumExpiry).toLocaleDateString()}`
                    : 'Active Subscription'
                  }
                </p>
              </div>
              <Star className="text-amber-400" size={24} />
            </div>
          </motion.div>
        )}

        {/* Profile Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowEditProfile(true)}
          className="w-full glass rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 overflow-hidden">
            {user.customProfilePicture ? (
              <img
                src={user.customProfilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              user.avatar
            )}
          </div>
          <div className="flex-1 text-left relative z-10">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <span className="text-lg">{user.country.flag}</span>
            </div>
            <p className="text-amber-400/80 text-sm flex items-center gap-1">
              <span>{rankInfo.icon}</span>
              <span>{user.rank}</span>
              <span className="text-white/40">•</span>
              <span>Level {user.level}</span>
            </p>
          </div>
          <ChevronRight className="text-white/30 relative z-10" size={24} />
        </motion.button>

        {/* Game Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-3 px-1">
            Game Settings
          </h3>
          <div className="glass rounded-2xl px-4">
            <SettingToggle
              icon={Eye}
              label="Show Legal Moves"
              description="Highlight possible moves"
              value={settings.showLegalMoves}
              onChange={(v) => updateSettings({ showLegalMoves: v })}
            />
            <SettingToggle
              icon={Crown}
              label="Auto-Queen"
              description="Auto-promote pawns to queen"
              value={settings.autoQueen}
              onChange={(v) => updateSettings({ autoQueen: v })}
            />
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-3 px-1">
            Appearance
          </h3>
          <div className="glass rounded-2xl px-4">
            {/* Board Themes */}
            <div className="py-4 border-b border-white/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-11 h-11 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center">
                  <Palette size={20} className="text-white/70" />
                </div>
                <p className="text-white font-medium">Board Theme</p>
              </div>

              {/* Regular Themes */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {regularThemes.map((theme) => (
                  <motion.button
                    key={theme.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleThemeSelect(theme.id)}
                    className={cn(
                      'rounded-xl p-2 border-2 transition-all',
                      settings.boardTheme === theme.id
                        ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : 'border-transparent hover:border-white/20'
                    )}
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-full aspect-square rounded-lg overflow-hidden mb-1.5 shadow-md">
                      <div className={theme.light} />
                      <div className={theme.dark} />
                      <div className={theme.dark} />
                      <div className={theme.light} />
                    </div>
                    <p className={cn(
                      "text-xs text-center font-medium truncate",
                      settings.boardTheme === theme.id ? 'text-amber-400' : 'text-white/50'
                    )}>{theme.name}</p>
                  </motion.button>
                ))}
              </div>

              {/* Premium Themes Section */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={14} className="text-amber-400" />
                  <span className="text-amber-400 text-xs font-medium uppercase tracking-wider">Premium Themes</span>
                  {!settings.isPremium && <Lock size={12} className="text-amber-400/50" />}
                </div>
                <p className="text-white/40 text-xs mb-3">Exclusive themes with special effects & animations</p>
                <div className="grid grid-cols-5 gap-2">
                  {premiumThemes.map((theme) => (
                    <motion.button
                      key={theme.id}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: settings.isPremium ? 1.05 : 1 }}
                      onClick={() => handleThemeSelect(theme.id)}
                      className={cn(
                        'rounded-xl p-1.5 border-2 transition-all relative',
                        settings.boardTheme === theme.id && settings.isPremium
                          ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                          : 'border-transparent',
                        !settings.isPremium && 'opacity-70'
                      )}
                    >
                      <div className="grid grid-cols-2 gap-0.5 w-full aspect-square rounded-lg overflow-hidden shadow-md relative">
                        <div className={cn(theme.light, 'relative')} />
                        <div className={cn(theme.dark, 'relative')} />
                        <div className={cn(theme.dark, 'relative')} />
                        <div className={cn(theme.light, 'relative')} />
                        {!settings.isPremium && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                            <Lock size={12} className="text-white/80" />
                          </div>
                        )}
                        {settings.isPremium && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-shimmer" />
                          </div>
                        )}
                      </div>
                      <p className={cn(
                        "text-[9px] text-center font-medium mt-1 truncate",
                        settings.boardTheme === theme.id && settings.isPremium ? 'text-amber-400' : 'text-white/40'
                      )}>{theme.name.replace(/^[^\s]+\s/, '')}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <SettingToggle
              icon={Moon}
              label="Dark Mode"
              description="Use dark theme"
              value={settings.darkMode}
              onChange={(v) => updateSettings({ darkMode: v })}
            />
          </div>
        </motion.div>

        {/* Notifications & Sound */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-3 px-1">
            Notifications & Sound
          </h3>
          <div className="glass rounded-2xl px-4">
            <SettingToggle
              icon={Bell}
              label="Push Notifications"
              description="Game invites, updates"
              value={settings.notifications}
              onChange={(v) => updateSettings({ notifications: v })}
            />
            <SettingToggle
              icon={Volume2}
              label="Sound Effects"
              description="Move sounds, alerts"
              value={settings.soundEnabled}
              onChange={(v) => updateSettings({ soundEnabled: v })}
            />
            <SettingToggle
              icon={Smartphone}
              label="Vibration"
              description="Haptic feedback"
              value={settings.vibrationEnabled}
              onChange={(v) => updateSettings({ vibrationEnabled: v })}
            />
          </div>
        </motion.div>

        {/* Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <h3 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-3 px-1">
            Subscription
          </h3>
          <div className="glass rounded-2xl px-4">
            <SettingLink
              icon={Crown}
              label={settings.isPremium ? "Manage Subscription" : "Upgrade to Premium"}
              value={settings.isPremium ? "Active" : "$1.99/mo"}
              onClick={() => setShowSubscription(true)}
              premium
            />
          </div>
        </motion.div>

        {/* Support & Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-3 px-1">
            Support & Help
          </h3>
          <div className="glass rounded-2xl px-4">
            <SettingLink
              icon={HelpCircle}
              label="How to Play"
              onClick={() => navigate('/instructions')}
            />
            <SettingLink
              icon={Headphones}
              label="Customer Support"
              value="Contact Us"
              onClick={() => setShowSupport(true)}
            />
            <SettingLink
              icon={FileText}
              label="Terms & Conditions"
              onClick={() => setShowTerms(true)}
            />
            <SettingLink
              icon={Shield}
              label="Privacy Policy"
              onClick={() => setShowPrivacy(true)}
            />
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <h3 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-3 px-1">
            Danger Zone
          </h3>
          <div className="glass rounded-2xl px-4">
            <SettingLink
              icon={Trash2}
              label="Reset All Data"
              onClick={() => setShowResetConfirm(true)}
              danger
            />
          </div>
        </motion.div>

        {/* Version */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-white/20 text-xs py-6"
        >
          Chess Champ v1.0.0 • Made with ♟️
        </motion.p>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 w-full max-w-sm space-y-5 border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white text-center">Edit Profile</h2>

              {/* Profile Picture Upload */}
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Camera size={12} />
                  Profile Picture
                </p>
                <div className="flex items-center gap-4">
                  {/* Current Profile Picture / Preview */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                      {editProfilePicture ? (
                        <img
                          src={editProfilePicture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">{editAvatar}</span>
                      )}
                    </div>
                    {editProfilePicture && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={removeProfilePicture}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <X size={14} className="text-white" />
                      </motion.button>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 text-sm"
                    >
                      <Image size={16} />
                      Upload Photo
                    </motion.button>
                    <p className="text-white/30 text-xs text-center">Max 2MB • JPG, PNG</p>
                  </div>
                </div>
              </div>

              {/* Avatar Selection (fallback if no profile picture) */}
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-3">
                  {editProfilePicture ? 'Or Choose Avatar' : 'Choose Avatar'}
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {avatarOptions.map((avatar) => (
                    <motion.button
                      key={avatar}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setEditAvatar(avatar);
                        setEditProfilePicture(null); // Clear custom picture when selecting avatar
                      }}
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all',
                        editAvatar === avatar && !editProfilePicture
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 scale-110 shadow-lg shadow-amber-500/30'
                          : 'bg-white/10 hover:bg-white/20'
                      )}
                    >
                      {avatar}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <User size={12} />
                  Display Name
                </p>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
                  placeholder="Enter your name"
                />
              </div>

              {/* Email Input */}
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Mail size={12} />
                  Email Address
                </p>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
                  placeholder="Enter your email"
                />
              </div>

              {/* Gender Selection */}
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Gender</p>
                <div className="grid grid-cols-2 gap-2">
                  {genderOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleGenderChange(option.value)}
                      className={cn(
                        'px-3 py-2 rounded-xl flex items-center gap-2 transition-all text-sm',
                        editGender === option.value
                          ? 'bg-amber-500/20 border border-amber-400/50 text-amber-400'
                          : 'bg-white/5 border border-transparent text-white/70'
                      )}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Country Selection */}
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Globe size={12} />
                  Country
                </p>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCountryPicker(true)}
                  className="w-full px-4 py-3 glass rounded-xl text-white flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{editCountry.flag}</span>
                    <span>{editCountry.name}</span>
                  </div>
                  <ChevronRight size={18} className="text-white/40" />
                </motion.button>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 py-3.5 glass rounded-xl text-white/70 font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveProfile}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                  <Check size={18} className="relative z-10" />
                  <span className="relative z-10">Save</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Country Picker Modal */}
      <AnimatePresence>
        {showCountryPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4"
            onClick={() => setShowCountryPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-4 w-full max-w-sm border border-white/10 max-h-[70vh] flex flex-col"
            >
              <h3 className="text-xl font-bold text-white text-center mb-4">Select Country</h3>
              <div className="overflow-y-auto flex-1 space-y-1">
                {COUNTRIES.map((country) => (
                  <motion.button
                    key={country.code}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setEditCountry(country);
                      setShowCountryPicker(false);
                    }}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all',
                      editCountry.code === country.code
                        ? 'bg-amber-500/20 border border-amber-400/50'
                        : 'hover:bg-white/10'
                    )}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <span className="text-white">{country.name}</span>
                    {editCountry.code === country.code && (
                      <Check size={18} className="text-amber-400 ml-auto" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 w-full max-w-sm space-y-4 border border-red-500/30"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-2xl flex items-center justify-center">
                  <Trash2 size={32} className="text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Reset All Data?</h2>
                <p className="text-white/50 mt-2">
                  This will delete all your progress, coins, history, and settings. This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3.5 glass rounded-xl text-white font-bold"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResetData}
                  className="flex-1 py-3.5 bg-red-500 rounded-xl text-white font-bold"
                >
                  Reset
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Theme Alert */}
      <AnimatePresence>
        {showPremiumThemeAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowPremiumThemeAlert(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 w-full max-w-sm space-y-4 border border-amber-500/30"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                  <Lock size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Premium Theme</h2>
                <p className="text-white/50 mt-2">
                  This theme is exclusive to Premium members. Upgrade to unlock all 5 premium themes!
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPremiumThemeAlert(false)}
                  className="flex-1 py-3.5 glass rounded-xl text-white/70 font-bold"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowPremiumThemeAlert(false);
                    setShowSubscription(true);
                  }}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-white font-bold"
                >
                  Upgrade
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowSubscription(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 w-full max-w-sm space-y-5 border border-amber-500/30 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30"
                >
                  <Crown size={40} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white">Chess Champ</h2>
                <p className="text-amber-400 font-bold text-lg">Premium Membership</p>
              </div>

              {/* Price */}
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 text-center">
                <p className="text-white/50 text-sm">Monthly Subscription</p>
                <p className="text-3xl font-bold text-white mt-1">$1.99<span className="text-lg text-white/50">/month</span></p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <p className="text-white/50 text-xs uppercase tracking-wider">Premium Features</p>

                {[
                  { icon: '🎨', text: '5 Exclusive Board Themes', desc: 'Diamond, Ruby, Emerald, Gold, Obsidian' },
                  { icon: '🚫', text: 'Ad-Free Experience', desc: 'Play without interruptions' },
                  { icon: '📊', text: 'Advanced Game Analysis', desc: 'Detailed move-by-move breakdown' },
                  { icon: '🏆', text: 'Priority Matchmaking', desc: 'Faster ranked matches' },
                  { icon: '💎', text: 'Exclusive Badges', desc: 'Premium profile flair' },
                  { icon: '💰', text: '2x Daily Rewards', desc: 'Double your daily coins' },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="flex items-start gap-3 bg-white/5 rounded-xl p-3"
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <p className="text-white font-medium">{feature.text}</p>
                      <p className="text-white/50 text-sm">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                {settings.isPremium ? (
                  <div className="text-center">
                    <p className="text-green-400 font-bold mb-2">✓ You're a Premium Member!</p>
                    <p className="text-white/50 text-sm">
                      {settings.premiumExpiry
                        ? `Your subscription renews on ${new Date(settings.premiumExpiry).toLocaleDateString()}`
                        : 'Thank you for your support!'
                      }
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowSubscription(false)}
                      className="w-full mt-4 py-4 glass rounded-xl text-white font-bold"
                    >
                      Close
                    </motion.button>
                  </div>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubscribe}
                      className="w-full py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-xl text-white font-bold text-lg shadow-lg shadow-amber-500/30 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                      <span className="relative z-10">Subscribe Now - $1.99/mo</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowSubscription(false)}
                      className="w-full py-3 text-white/50 font-medium"
                    >
                      Maybe Later
                    </motion.button>

                    <p className="text-white/30 text-xs text-center">
                      Cancel anytime. Subscription auto-renews monthly.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Support Modal */}
      <AnimatePresence>
        {showSupport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowSupport(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 w-full max-w-sm space-y-5 border border-white/10"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Headphones size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Customer Support</h2>
                <p className="text-white/50 mt-2">
                  We're here to help! Reach out to us for any questions, issues, or feedback.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Email Us At</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <Mail size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Support@Dipomdutta.com</p>
                      <p className="text-white/40 text-sm">Response within 24-48 hours</p>
                    </div>
                  </div>
                </div>

                <motion.a
                  href="mailto:Support@Dipomdutta.com?subject=Chess%20Master%20Pro%20Support%20Request"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-white font-bold text-center block shadow-lg shadow-amber-500/30"
                >
                  Send Email
                </motion.a>

                <div className="text-center">
                  <p className="text-white/30 text-xs">
                    Please include your username and device info for faster support.
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSupport(false)}
                className="w-full py-3 glass rounded-xl text-white/70 font-medium"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms & Conditions Modal */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowTerms(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 w-full max-w-sm border border-white/10 max-h-[85vh] flex flex-col"
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                  <FileText size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Terms & Conditions</h2>
                <p className="text-white/40 text-sm">Last updated: January 2025</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 text-white/70 text-sm pr-2">
                <section>
                  <h3 className="text-white font-bold mb-2">1. Acceptance of Terms</h3>
                  <p>By downloading, installing, or using Chess Master Pro ("the App"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the App.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">2. Description of Service</h3>
                  <p>Chess Master Pro is a mobile chess application that provides:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Player vs Computer (PvE) chess matches</li>
                    <li>Player vs Player (PvP) chess matches</li>
                    <li>Virtual coin economy for in-game activities</li>
                    <li>Ranking and progression systems</li>
                    <li>Chess puzzles and learning features</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">3. User Accounts</h3>
                  <p>Users are responsible for maintaining the confidentiality of their account information. You agree to provide accurate and complete information when creating your profile.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">4. Virtual Currency</h3>
                  <p>The App uses virtual coins for gameplay purposes only. Virtual coins:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Have no real-world monetary value</li>
                    <li>Cannot be exchanged for real currency</li>
                    <li>Are non-transferable between accounts</li>
                    <li>May be modified or reset at our discretion</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">5. Premium Subscription</h3>
                  <p>Premium subscriptions are billed monthly at $1.99 USD. Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current billing period. No refunds for partial months.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">6. Prohibited Conduct</h3>
                  <p>Users may not:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Use cheating software or engines during gameplay</li>
                    <li>Exploit bugs or glitches for unfair advantage</li>
                    <li>Harass or abuse other players</li>
                    <li>Create multiple accounts for manipulation</li>
                    <li>Engage in match-fixing or collusion</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">7. Termination</h3>
                  <p>We reserve the right to suspend or terminate accounts that violate these terms without prior notice. Upon termination, all virtual currency and progress may be forfeited.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">8. Disclaimer of Warranties</h3>
                  <p>The App is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">9. Limitation of Liability</h3>
                  <p>We shall not be liable for any indirect, incidental, or consequential damages arising from the use of the App.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">10. Changes to Terms</h3>
                  <p>We may modify these terms at any time. Continued use of the App after changes constitutes acceptance of the new terms.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">11. Contact</h3>
                  <p>For questions about these terms, contact us at:<br />
                    <span className="text-amber-400">Support@Dipomdutta.com</span></p>
                </section>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTerms(false)}
                className="w-full py-3 mt-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-white font-bold"
              >
                I Understand
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowPrivacy(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 w-full max-w-sm border border-white/10 max-h-[85vh] flex flex-col"
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <Shield size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
                <p className="text-white/40 text-sm">Last updated: January 2025</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 text-white/70 text-sm pr-2">
                <section>
                  <h3 className="text-white font-bold mb-2">1. Introduction</h3>
                  <p>Chess Champ ("we", "our", "us") respects your privacy and is committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">2. Information We Collect</h3>
                  <p className="font-medium text-white/80 mt-2">Profile Information:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Display name</li>
                    <li>Email address (optional)</li>
                    <li>Country</li>
                    <li>Gender preference</li>
                    <li>Profile picture</li>
                  </ul>

                  <p className="font-medium text-white/80 mt-3">Gameplay Data:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Match history and statistics</li>
                    <li>Level and rank progression</li>
                    <li>Virtual coin transactions</li>
                    <li>Puzzle completion data</li>
                  </ul>

                  <p className="font-medium text-white/80 mt-3">Device Information:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Device type and operating system</li>
                    <li>App version</li>
                    <li>Crash reports and performance data</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">3. How We Use Your Information</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Provide and improve game services</li>
                    <li>Personalize your gaming experience</li>
                    <li>Process transactions and subscriptions</li>
                    <li>Send important notifications</li>
                    <li>Detect and prevent cheating or fraud</li>
                    <li>Respond to customer support requests</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">4. Data Storage</h3>
                  <p>Your game data is stored locally on your device and may be backed up to secure cloud servers. We use industry-standard encryption to protect your data during transmission and storage.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">5. Data Sharing</h3>
                  <p>We do not sell your personal data. We may share data with:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Service providers (hosting, analytics)</li>
                    <li>Legal authorities when required by law</li>
                    <li>Other players (public profile information only)</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">6. Your Rights</h3>
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate data</li>
                    <li>Delete your account and data</li>
                    <li>Export your data</li>
                    <li>Opt out of marketing communications</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">7. Children's Privacy</h3>
                  <p>Our App is not intended for children under 13. We do not knowingly collect data from children under 13. If you believe we have collected such data, please contact us immediately.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">8. Cookies and Tracking</h3>
                  <p>We use local storage and similar technologies to save your preferences and game progress. This data remains on your device unless you choose to sync or backup.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">9. Third-Party Services</h3>
                  <p>The App may contain links to third-party services. We are not responsible for the privacy practices of these services.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">10. Updates to This Policy</h3>
                  <p>We may update this policy periodically. We will notify you of significant changes through the App or via email.</p>
                </section>

                <section>
                  <h3 className="text-white font-bold mb-2">11. Contact Us</h3>
                  <p>For privacy concerns or data requests, contact:<br />
                    <span className="text-amber-400">Support@Dipomdutta.com</span></p>
                  <p className="mt-2">We will respond to all requests within 30 days.</p>
                </section>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPrivacy(false)}
                className="w-full py-3 mt-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-white font-bold"
              >
                I Understand
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
