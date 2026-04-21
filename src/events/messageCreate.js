export default () => async (message) => {
  console.log("EVENT FIRED:", message.content);

  // ignore bots
  if (message.author.bot) return;
  if (!message.guild) return;

  try {
    // STEP 1: PROVE BOT CAN RESPOND
    await message.channel.send("✅ BOT IS WORKING");

    // STEP 2: show raw input
    console.log("MESSAGE RECEIVED:", message.content);

  } catch (err) {
    console.error("SEND ERROR:", err);
  }
};
