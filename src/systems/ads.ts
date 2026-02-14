import {
    AdMob,
    RewardAdOptions,
    AdMobRewardItem,
    RewardAdPluginEvents
} from '@capacitor-community/admob';

/**
 * Centralized Ad Service for Chess Champ
 * Handles rewarded ads with Google Play policy compliance.
 */

export interface AdStats {
    adsWatched: number;
    totalRewardsEarned: number;
}

class AdService {
    private rewardedAdId: string = "ca-app-pub-7946268560642689/2758967492";
    private initialized: boolean = false;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        try {
            await AdMob.initialize();
            this.initialized = true;
            console.log(`[AdService] AdMob Initialized`);
        } catch (e) {
            console.error(`[AdService] Initialization failed`, e);
        }
    }

    /**
     * Shows a rewarded ad to the user.
     * COMPLIANCE: Must be called after explicit user consent (button click).
     */
    async showRewardedAd(type: 'double_reward' | 'time_rescue' | 'recover_coins'): Promise<boolean> {
        if (!this.initialized) await this.initialize();

        console.log(`[AdService] Requesting rewarded ad for: ${type}`);

        try {
            const options: RewardAdOptions = {
                adId: this.rewardedAdId,
                // isTesting: true, // Set to true during development
            };

            await AdMob.prepareRewardVideoAd(options);

            return new Promise(async (resolve) => {
                let rewardReceived = false;

                const onReward = (reward: AdMobRewardItem) => {
                    console.log(`[AdService] Reward received:`, reward);
                    rewardReceived = true;
                };

                const cleanup = () => {
                    rewardedListener.remove();
                    dismissedListener.remove();
                    failedListener.remove();
                };

                const onDismissed = () => {
                    console.log(`[AdService] Ad dismissed`);
                    cleanup();
                    // Resume background music
                    import('@/systems/audio').then(m => m.audioManager.resumeBackground());
                    resolve(rewardReceived);
                };

                const onFailed = (info: any) => {
                    console.error(`[AdService] Ad failed`, info);
                    cleanup();
                    resolve(false);
                };

                const rewardedListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, onReward);
                const dismissedListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, onDismissed);
                const failedListener = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, onFailed);

                // Pause background music while ad is playing
                import('@/systems/audio').then(m => m.audioManager.pauseBackground());

                await AdMob.showRewardVideoAd();
            });
        } catch (e) {
            console.error(`[AdService] Failed to show rewarded ad`, e);
            // Ensure music resumes if show fails nicely (though catch block might be too late if await throws immediately)
            import('@/systems/audio').then(m => m.audioManager.resumeBackground());
            return false;
        }
    }

    /**
     * Disclosure text required by Google Play for rewarded ads
     */
    getDisclosure(type: 'double_reward' | 'time_rescue' | 'recover_coins'): string {
        if (type === 'double_reward') {
            return "Watch a short video to double your coin reward for this game!";
        }
        if (type === 'recover_coins') {
            return "Watch a short video to recover the coins you spent to join this match!";
        }
        return "Watch a short video to get +5 minutes of extra time and continue playing!";
    }
}

export const ads = new AdService();
