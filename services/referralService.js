import { supabase } from '../db/supabase.js';

/**
 * Create a referral code for a user
 */
export async function createReferralCode(userId) {
    const code = `REF-${userId}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data, error } = await supabase
        .from('referrals')
        .insert([
            {
                user_id: userId,
                referral_code: code,
                uses: 0,
                created_at: new Date()
            }
        ])
        .select()
        .single();

    if (error) throw error;

    return data;
}

/**
 * Get referral by code
 */
export async function getReferral(code) {
    const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referral_code', code)
        .single();

    if (error) throw error;

    return data;
}

/**
 * Get total referral count for a user
 */
export async function getReferralCount(userId) {
    const { data, error } = await supabase
        .from('referrals')
        .select('uses')
        .eq('user_id', userId);

    if (error) throw error;

    const total = data.reduce((sum, row) => sum + (row.uses || 0), 0);

    return total;
}

/**
 * Increment referral usage
 */
export async function useReferral(code) {
    const { data: referral, error: fetchError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referral_code', code)
        .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
        .from('referrals')
        .update({ uses: (referral.uses || 0) + 1 })
        .eq('referral_code', code);

    if (updateError) throw updateError;

    return true;
}
