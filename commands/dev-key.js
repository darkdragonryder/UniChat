let durationText;

if (days === null) {
  durationText = 'lifetime';
} else {
  durationText = `${days} days`;
}

return interaction.reply({
  content:
    `✅ ${type.toUpperCase()} key generated:\n\n` +
    `🔑 \`${key}\`\n\n` +
    `⏳ Duration: **${durationText}**`,
  ephemeral: true
});
