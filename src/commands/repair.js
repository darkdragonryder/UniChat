import { supabase } from "../services/supabase.js";

export default async function repairCommand(interaction) {
  try {

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels;

    if (!channels) {
      return interaction.editReply("❌ No channels found in DB");
    }

    await guild.roles.fetch();
    await guild.channels.fetch();

    let fixed = 0;

    for (const [lang, channelId] of Object.entries(channels)) {

      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;

      const role = guild.roles.cache.find(r =>
        r.name.toLowerCase().includes(lang.toLowerCase())
      );

      if (!role) continue;

      await channel.permissionOverwrites.set([
        {
          id: guild.roles.everyone.id,
          deny: ["ViewChannel"]
        },
        {
          id: role.id,
          allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
        },
        {
          id: guild.members.me.id,
          allow: ["ViewChannel", "SendMessages", "ManageMessages"]
        }
      ]);

      fixed++;
    }

    return interaction.editReply(
      `✅ Repair complete: fixed ${fixed} channels`
    );

  } catch (err) {
    console.log("REPAIR ERROR:", err);
    return interaction.editReply("❌ Repair failed");
  }
}
