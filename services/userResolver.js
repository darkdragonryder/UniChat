export async function resolveUser(client, userId) {
  try {
    const user = await client.users.fetch(userId);
    return user?.tag || userId;
  } catch {
    return userId;
  }
}
