import { Contacts } from '@capacitor-community/contacts';
import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';

export interface SyncResult {
    matchingUsers: any[];
    newContacts: string[];
}

export async function syncContacts(userId: string) {
    if (Capacitor.getPlatform() === 'web') return { matchingUsers: [], newContacts: [] };

    try {
        const permission = await Contacts.requestPermissions();
        if (permission.contacts !== 'granted') {
            throw new Error('Contacts permission not granted');
        }

        const { contacts } = await Contacts.getContacts({
            projection: {
                name: true,
                phones: true,
            }
        });

        // Extract all phone numbers
        const phoneNumbers = contacts
            .flatMap(c => c.phones?.map(p => p.number) || [])
            .filter((p): p is string => !!p)
            .map(p => p.replace(/\s+/g, '').replace(/[()\-]/g, '')); // Clean numbers

        if (phoneNumbers.length === 0) return { matchingUsers: [], newContacts: [] };

        // Find users in Supabase who have these phone numbers
        const { data: matchedUsers, error } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, phone_number, level, rank, country_code, country_name, country_flag')
            .in('phone_number', phoneNumbers)
            .not('id', 'eq', userId);

        if (error) {
            console.error('Error finding matching users:', error);
            throw error;
        }

        return {
            matchingUsers: matchedUsers || [],
            phoneNumbers
        };

    } catch (e) {
        console.error('Error syncing contacts:', e);
        throw e;
    }
}
