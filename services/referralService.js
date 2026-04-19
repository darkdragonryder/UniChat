import supabase from '../db/supabase.js';

/**
 * Get leaderboard of referrals for a guild
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
 * Add referral to a user
 */
export async function addReferral(guildId, ownerId) {
  try {
    // check existing
    const { data: existing } = await supabase
      .from('referrals')
      .select('*')
      .eq('guildId', guildId)
      .eq('ownerId', ownerId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('referrals')
        .update({ total: existing.total + 1 })
        .eq('guildId', guildId)
        .eq('ownerId', ownerId);

      if (error) console.log('addReferral update error:', error);
      return;
    }

    // insert new
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
 * Get user referral stats
 */
export async function getUserReferrals(guildId, ownerId) {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('total')
      .eq('guildId', guildId)
      .eq('ownerId', ownerId)
      .single();

    if (error) return 0;

    return data?.total || 0;
  } catch (err) {
    return 0;
  }
}

/**
 * Redeem referral reward (placeholder for premium system later)
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

    // reset after redeem (optional logic)
    await supabase
      .from('referrals')
      .update({ total: 0 })
      .eq('guildId', guildId)
      .eq('ownerId', ownerId);

    return {
      success: true,
      message: 'Referral reward redeemed!'
    };

  } catch (err) {
    console.log('redeemReferral error:', err);
    return {
      success: false,
      message: 'Error redeeming referral'
    };
  }
}
