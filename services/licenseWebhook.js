export async function sendLicenseWebhook(type, key, guildId, userId) {
  if (!process.env.LICENSE_WEBHOOK) return;

  try {
    await fetch(process.env.LICENSE_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content:
          `🔑 License Event\n` +
          `Type: ${type}\n` +
          `Key: ${key}\n` +
          `Guild: ${guildId}\n` +
          `User: ${userId}`
      })
    });
  } catch (err) {
    console.log('Webhook error:', err);
  }
}
