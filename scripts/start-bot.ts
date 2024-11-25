import { initDiscordBot } from '../lib/discord-bot.ts';

async function startBot() {
  try {
    await initDiscordBot();
    console.log('Bot started successfully');
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

startBot();