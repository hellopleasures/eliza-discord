import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  try {
    // For testing, just echo back the message
    await message.channel.send(`You said: ${message.content}`);
  } catch (error) {
    console.error('Error processing message:', error);
    await message.channel.send('Sorry, I encountered an error processing your message.');
  }
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error('Error logging in:', error);
  process.exit(1);
});