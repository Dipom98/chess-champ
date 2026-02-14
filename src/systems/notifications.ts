import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';

export async function initializeNotifications(userId: string) {
    if (Capacitor.getPlatform() === 'web') return;

    try {
        // Request permission
        const permStatus = await PushNotifications.requestPermissions();

        if (permStatus.receive === 'granted') {
            // Register for push notifications
            await PushNotifications.register();
        }

        // On registration success
        await PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value);

            // Only save token to Supabase if we have a real user
            if (userId && userId !== 'local-user') {
                const { error } = await supabase
                    .from('push_tokens')
                    .upsert({
                        user_id: userId,
                        token: token.value,
                        platform: Capacitor.getPlatform(),
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    console.error('Error saving push token to Supabase:', error);
                }
            }
        });

        // On registration error
        await PushNotifications.addListener('registrationError', (error) => {
            console.error('Push registration error: ' + JSON.stringify(error));
        });

        // On push received
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
        });

        // On action performed
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
        });

    } catch (e) {
        console.error('Error initializing push notifications:', e);
    }
}

export async function checkNotificationPermission() {
    if (Capacitor.getPlatform() === 'web') return 'granted';
    const status = await PushNotifications.checkPermissions();
    return status.receive;
}
