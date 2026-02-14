/**
 * Centralized Ad Service for Chess Champ
 * Handles rewarded ads with Google Play policy compliance.
 */

export interface AdStats {
    adsWatched: number;
    totalRewardsEarned: number;
}

// Mock Ad Service Implementation
// Replace with actual AdMob integration later
class AdService {
    private adId: string = "ca-app-pub-7946268560642689/2758967492";

    constructor() {
        console.log(`[AdService] Initialized with ID: ${this.adId}`);
    }

    /**
     * Shows a rewarded ad to the user.
     * COMPLIANCE: Must be called after explicit user consent (button click).
     */
    async showRewardedAd(type: 'double_reward' | 'time_rescue'): Promise<boolean> {
        console.log(`[AdService] Requesting rewarded ad for: ${type}`);

        // Simulate ad loading and watching
        return new Promise((resolve) => {
            // Small delay to simulate ad playback
            setTimeout(() => {
                // 95% success rate for simulation
                const success = Math.random() < 0.95;
                if (success) {
                    console.log(`[AdService] Ad watched successfully for: ${type}`);
                    resolve(true);
                } else {
                    console.warn(`[AdService] Ad failed or was dismissed for: ${type}`);
                    resolve(false);
                }
            }, 2000);
        });
    }

    /**
     * Disclosure text required by Google Play for rewarded ads
     */
    getDisclosure(type: 'double_reward' | 'time_rescue'): string {
        if (type === 'double_reward') {
            return "Watch a short video to double your coin reward for this game!";
        }
        return "Watch a short video to get +5 minutes of extra time and continue playing!";
    }
}

export const ads = new AdService();
