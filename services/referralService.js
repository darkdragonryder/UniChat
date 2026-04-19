import { supabase } from '../db/supabase.js';

/* =========================
   CREATE REFERRAL CODE
========================= */
export async function createReferralCode(userId) {
  const code = Math.random().toString(36).substring(2, 10);

  const { data, error } = await supabase
    .from('referrals')
    .insert([{ user_id: userId, code, uses: 0 }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* =========================
   GET REFERRAL
========================= */
export async function getReferral(code) {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('code', code)
    .single();

  if (error) return null;
  return data;
}

/* =========================
   GET REFERRAL COUNT
========================= */
export async function getReferralCount(userId) {
  const { data, error } = await supabase
    .from('referrals')
    .select('uses')
    .eq('user_id', userId);

  if (error) return 0;

  return data.reduce((sum, r) => sum + (r.uses || 0), 0);
}

/* =========================
   CHECK IF USER USED REFERRAL
========================= */
export async function hasUserUsedReferral(userId) {
  const { data, error } = await supabase
    .from('referral_uses')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

/* =========================
   USE REFERRAL
========================= */
export async function useReferral(code, userId) {
  const referral = await getReferral(code);
  if (!referral) return { success: false, message: "Invalid referral code" };

  const alreadyUsed = await hasUserUsedReferral(userId);
  if (alreadyUsed) {
    return { success: false, message: "You already used a referral" };
  }

  await supabase.from('referral_uses').insert([
    {
      user_id: userId,
      referral_code: code
    }
  ]);

  await supabase
    .from('referrals')
    .update({ uses: referral.uses + 1 })
    .eq('code', code);

  return { success: true };
}
