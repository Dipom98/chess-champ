import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
// In a production environment, use environment variables (.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Data Snapshot interface for cloud storage
 */
export interface PlayerDataSnapshot {
    user_id: string;
    updated_at: string;
    profile_data: any;
    wallet_data: any;
    settings_data: any;
    history_data: any;
}

/**
 * Pushes the current player state to the cloud
 * ONLY called if user is Premium and logged in
 */
export async function pushPlayerSnapshot(snapshot: PlayerDataSnapshot) {
    const { data, error } = await supabase
        .from('player_snapshots')
        .upsert(snapshot, { onConflict: 'user_id' });

    if (error) {
        console.error('[Supabase] Error pushing snapshot:', error);
        throw error;
    }
    return data;
}

/**
 * Fetches the latest player state from the cloud
 */
export async function fetchPlayerSnapshot(userId: string) {
    const { data, error } = await supabase
        .from('player_snapshots')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('[Supabase] Error fetching snapshot:', error);
        throw error;
    }
    return data;
}
