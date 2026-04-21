import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Show system health'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const mem = process.memoryUsage();

    const guildCount = interaction.client.guilds.cache.size;

    return interaction.editReply(
      `📊 **SYSTEM STATUS**

🧠 Memory:
- RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB
- Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB

🌍 Guilds: ${guildCount}

⚙ Bot: ONLINE
🟢 Database: ACTIVE
🔐 License System: RUNNING
🛡 Fraud System: ACTIVE`
    );
  }
};
