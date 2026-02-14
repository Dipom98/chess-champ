import { useGameStore } from '@/store/gameStore';

// Sound effect URLs - these are placeholders. Replace with your own assets.
const SOUNDS = {
    // Short "pop" sound (Base64) to guarantee it works without network issues
    move: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU',
    capture: 'https://assets.mixkit.co/active_storage/sfx/2046/2046-preview.mp3',
    check: 'https://assets.mixkit.co/active_storage/sfx/1041/1041-preview.mp3',
    gameStart: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    gameOver: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
};

// Background music assets (local)
const MUSIC_TRACKS = {
    classic: '/assets/audio/bgm_classic.mp3',
    blitz: '/assets/audio/bgm_blitz.mp3',
    menu: '/assets/audio/bgm_menu.mp3',
};

class AudioManager {
    private bgMusic: HTMLAudioElement | null = null;
    private currentTrack: string | null = null;
    private sounds: Record<string, string> = {}; // Store URLs, not Audio objects
    private initialized = false;

    constructor() {
        // Store sound URLs
        this.sounds = { ...SOUNDS };
    }

    // Call this on first user interaction
    initialize() {
        if (this.initialized) return;

        // Try to unlock audio context
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            ctx.resume().then(() => {
                this.initialized = true;
                this.playBackground();
            }).catch(e => {
                console.warn('AudioContext resume failed', e);
                this.initialized = true; // Still mark as initialized to allow subsequent plays
                this.playBackground();
            });
        } else {
            this.initialized = true;
            this.playBackground();
        }
    }

    play(soundKey: keyof typeof SOUNDS) {
        const settings = useGameStore.getState().settings;
        if (!settings.soundEnabled) return;

        if (!this.initialized) {
            // console.warn(`Audio "${soundKey}" not played: AudioManager not initialized by user interaction.`);
            return;
        }

        const soundUrl = this.sounds[soundKey];
        if (!soundUrl) {
            console.warn(`Sound URL for "${soundKey}" not found.`);
            return;
        }

        try {
            // Create a new Audio instance for each play to allow overlapping sounds
            const audio = new Audio(soundUrl);
            audio.volume = 0.5;
            audio.play().catch(e => {
                // Ignore autoplay errors, specific logic will handle background music
                // console.warn(`Failed to play sound "${soundKey}":`, e);
            });
        } catch (e) {
            console.warn(`Error creating or playing audio for "${soundKey}":`, e);
        }
    }

    setMusicVolume(volume: number) {
        if (this.bgMusic) {
            this.bgMusic.volume = Math.max(0, Math.min(1, volume));
        }
    }

    playBackground() {
        if (!this.initialized) return;

        const state = useGameStore.getState();
        const settings = state.settings;

        if (!settings.backgroundMusicEnabled) {
            this.stopBackground();
            return;
        }

        // Determine track based on game state
        // Default to menu music
        let targetTrack = MUSIC_TRACKS.menu;

        // If in game
        if (state.currentGame && state.gameMode) {
            if (state.timeControl === 'blitz' || state.timeControl === 'bullet') {
                targetTrack = MUSIC_TRACKS.blitz;
            } else {
                targetTrack = MUSIC_TRACKS.classic;
            }
        }

        // If track changed or not playing
        if (this.currentTrack !== targetTrack || !this.bgMusic) {
            if (this.bgMusic) {
                this.bgMusic.pause();
                this.bgMusic = null;
            }

            this.currentTrack = targetTrack;
            this.bgMusic = new Audio(targetTrack);
            this.bgMusic.loop = true;
            this.bgMusic.volume = settings.musicVolume ?? 0.5;
            this.bgMusic.volume = settings.musicVolume ?? 0.5;
        } else {
            // Same track, ensure volume is correct
            if (this.bgMusic) {
                this.bgMusic.volume = settings.musicVolume ?? 0.5;
            }
        }

        if (this.bgMusic && this.bgMusic.paused) {
            this.bgMusic.play().catch(e => {
                console.warn('Background music play failed (likely autoplay blocked or missing file):', e);
            });
        }
    }

    pauseBackground() {
        if (this.bgMusic && !this.bgMusic.paused) {
            this.bgMusic.pause();
            // No need to save time manually, HTMLAudioElement keeps currentTime
        }
    }

    resumeBackground() {
        const settings = useGameStore.getState().settings;
        if (settings.backgroundMusicEnabled && this.bgMusic) {
            this.bgMusic.play().catch(e => console.warn('Resume failed', e));
        }
    }

    stopBackground() {
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
            // Don't nullify bgMusic so we can resume/play same track easily if toggled back
            // But if we want to fully stop, we can. 
            // For now, let's keep the object but pause it.
        }
    }

    toggleBackground(enabled: boolean) {
        if (enabled) {
            this.playBackground();
        } else {
            this.stopBackground();
        }
    }
}

export const audioManager = new AudioManager();

// Add global listener for first interaction to unlock audio
if (typeof window !== 'undefined') {
    const unlockAudio = () => {
        audioManager.initialize();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
}
