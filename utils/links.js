import fs from 'fs';

export function getLinkedChannels(channelId) {
  const config = JSON.parse(fs.readFileSync('./config.json'));
  return config.linkedChannels[channelId] || [];
}