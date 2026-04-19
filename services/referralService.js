import supabase from '../db/supabase.js';
import { randomUUID } from 'crypto';

/**
 * =========================
 * LEADERBOARD
 * =========================
 */
export async function getLeaderboard(guildId) {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('ownerId, total')
      .eq('guildId', guildId)
      .order('total', { ascending: false });

    if (error) {
      console.log('getLeaderboard error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.log('getLeaderboard exception:', err);
    return [];
  }
}

/**
 * =========================
 * ADD REFERRAL
 * =========================
 */
export async function addReferral(guildId, ownerId) {
  try {
    const { data: existing } = await supabase
      .from('referrals')
      .select('*')
      .eq('guildId', guildId)
      .eq('ownerId', ownerId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('referrals')
        .update({ total: existing.total + 1 })
        .eq('guildId', guildId)
        .eq('ownerId', ownerId);

      if (error) console.log('addReferral update error:', error);
      return;
    }

    const { error } = await supabase
      .from('referrals')
      .insert([
        {
          guildId,
          ownerId,
          total: 1
        }
      ]);

    if (error) console.log('addReferral insert error:', error);

  } catch (err) {
    console.log('addReferral exception:', err);
  }
}

/**
 * =========================
 * GET USER REFERRALS
 * =========================
 */
export async function getUserReferrals(guildId, ownerId) {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('total')
      .eq('guildId', guildId)
      .eq('ownerId', ownerId)
      .maybeSingle();

    if (error) return 0;

    return data?.total || 0;
  } catch (err) {
    return 0;
  }
}

/**
 * =========================
 * CREATE REFERRAL CODE
 * =========================
 */
export async function createReferralCode(guildId, ownerId) {
  try {
    const code = randomUUID().slice(0, 8);

    const { error } = await supabase
      .from('referral_codes')
      .insert([
        {
          guildId,
          ownerId,
          code
        }
      ]);

    if (error) {
      console.log('createReferralCode error:', error);
      return null;
    }

    return code;

  } catch (err) {
    console.log('createReferralCode exception:', err);
    return null;
  }
}

/**
 * =========================
 * REDEEM REWARD
 * =========================
 */
export async function redeemReferral(guildId, ownerId) {
  try {
    const count = await getUserReferrals(guildId, ownerId);

    if (count < 5) {
      return {
        success: false,
        message: 'Not enough referrals yet.'
      };
    }

    const { error } = await supabase
      .from('referrals')
      .update({ total: 0 })
      .eq('guildId', guildId)
      .eq('ownerId', ownerId);

    if (error) {
      console.log('redeemReferral reset error:', error);
    }

    return {
      success: true,
      message: 'Referral reward redeemed!'
    };

  } catch (err) {
    console.log('redeemReferral exception:', err);
    return {
      success: false,
      message: 'Error redeeming referral'
    };
  }
}
