import { supabase } from './supabase';
import { useGameStore, ChatMessage, IncomingChallenge } from '@/store/gameStore';
import { RealtimeChannel } from '@supabase/supabase-js';

let presenceChannel: RealtimeChannel | null = null;
let messagesChannel: RealtimeChannel | null = null;
let challengesChannel: RealtimeChannel | null = null;

export function initializeRealtime(userId: string) {
    if (presenceChannel) presenceChannel.unsubscribe();
    if (messagesChannel) messagesChannel.unsubscribe();
    if (challengesChannel) challengesChannel.unsubscribe();

    const store = useGameStore.getState();

    // 1. Presence setup
    presenceChannel = supabase.channel('online-players', {
        config: {
            presence: {
                key: userId,
            },
        },
    });

    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel!.presenceState();
            Object.entries(state).forEach(([id]) => {
                if (id !== userId) {
                    store.updateFriendStatus(id, true);
                }
            });
        })
        .on('presence', { event: 'join' }, ({ key }) => {
            if (key !== userId) {
                store.updateFriendStatus(key, true);
            }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
            if (key !== userId) {
                store.updateFriendStatus(key, false, new Date().toISOString());
            }
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel!.track({
                    online_at: new Date().toISOString(),
                });
            }
        });

    // 2. Real-time Messages
    messagesChannel = supabase
        .channel('messages-channel')
        .on(
            'postgres_changes' as any,
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${userId}`,
            },
            (payload) => {
                const msg = payload.new as ChatMessage;
                store.addChatMessage(msg.sender_id, msg);
                console.log('[Realtime] New message received:', msg);
            }
        )
        .subscribe();

    // 3. Real-time Challenges
    challengesChannel = supabase
        .channel('challenges-channel')
        .on(
            'postgres_changes' as any,
            {
                event: 'INSERT',
                schema: 'public',
                table: 'challenges',
                filter: `receiver_id=eq.${userId}`,
            },
            async (payload: any) => {
                const challenge = payload.new;

                const { data: sender } = await supabase
                    .from('profiles')
                    .select('name, avatar_url')
                    .eq('id', challenge.sender_id)
                    .single();

                const incomingChallenge: IncomingChallenge = {
                    id: challenge.id,
                    sender_id: challenge.sender_id,
                    sender_name: sender?.name || 'Chess Player',
                    sender_avatar: sender?.avatar_url || '👤',
                    status: challenge.status,
                    created_at: challenge.created_at,
                };

                store.addChallenge(incomingChallenge);
                console.log('[Realtime] New challenge received:', incomingChallenge);
            }
        )
        .on(
            'postgres_changes' as any,
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'challenges',
                filter: `sender_id=eq.${userId}`,
            },
            (payload: any) => {
                const updated = payload.new;
                if (updated.status === 'accepted') {
                    console.log('[Realtime] Challenge accepted by opponent!');
                }
            }
        )
        .subscribe();
}

export function stopRealtime() {
    if (presenceChannel) presenceChannel.unsubscribe();
    if (messagesChannel) messagesChannel.unsubscribe();
    if (challengesChannel) challengesChannel.unsubscribe();
}
