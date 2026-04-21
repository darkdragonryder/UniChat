export default async (message) => {
  console.log("EVENT FIRED:", message.content);

  if (message.author.bot) return;
  if (!message.guild) return;

  try {
    await message.channel.send("✅ WORKING AFTER REBUILD");
    console.log("MESSAGE SENT SUCCESSFULLY");
  } catch (err) {
    console.error("SEND ERROR:", err);
  }
};
