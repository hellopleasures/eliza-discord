import { Client, GatewayIntentBits, Message } from 'discord.js';
import { postToTwitter } from './twitter-service';
import dotenv from 'dotenv';

dotenv.config();

interface ApiResponse {
  text?: string;
  error?: string;
  response?: string;
  message?: string;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const AGENT_ID = process.env.AGENT_ID || "b850bc30-45f8-0041-a00a-83df46d8555d";
const AGENT_URL = process.env.AGENT_URL || "http://localhost:3000";
const ALLOWED_ROLE_NAME = process.env.ALLOWED_ROLE_NAME || "Twitter Manager";

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async (message: Message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  try {
    console.log('----------------------');
    console.log('Received message:', message.content);

    // Check if user has the required role for !tweet commands
    const hasRequiredRole = message.member?.roles.cache.some(role => role.name === ALLOWED_ROLE_NAME);

    // Handle direct !tweet command
    if (message.content.startsWith('!tweet ')) {
      if (!hasRequiredRole) {
        await message.reply({
          content: `❌ You need the "${ALLOWED_ROLE_NAME}" role to use the !tweet command.`,
          failIfNotExists: false
        });
        return;
      }

      // Get the content after !tweet
      const tweetContent = message.content.slice(7).trim();
      
      // Post directly to Twitter
      const tweetResult = await postToTwitter(tweetContent);
      
      if (tweetResult.success) {
        await message.reply(
          `✅ I've posted your message on Twitter!\n📱 View the tweet: https://twitter.com/x/status/${tweetResult.tweetId}`
        );
      } else {
        await message.reply(
          `❌ Failed to post to Twitter: ${tweetResult.error}`
        );
      }
      return;
    }

    // Check if this is a reply to the bot's message with !tweet command
    if (message.reference && message.content.includes('!tweet')) {
      if (!hasRequiredRole) {
        await message.reply({
          content: `❌ You need the "${ALLOWED_ROLE_NAME}" role to use the !tweet command.`,
          failIfNotExists: false
        });
        return;
      }

      // Fetch the message being replied to
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId!);
      
      // Check if it's a reply to the bot's message
      if (repliedMessage.author.id === client.user!.id) {
        // Post the bot's original response to Twitter
        const tweetResult = await postToTwitter(repliedMessage.content);
        
        if (tweetResult.success) {
          await message.reply(
            `✅ I've posted my response on Twitter!\n📱 View the tweet: https://twitter.com/x/status/${tweetResult.tweetId}`
          );
        } else {
          await message.reply(
            `❌ Failed to post my response to Twitter: ${tweetResult.error}`
          );
        }
        return;
      }
    }

    // Only process other messages that mention the bot
    if (!message.mentions.has(client.user!)) return;

    // Remove the bot mention from the message content
    const content = message.content.replace(/<@!\d+>|<@\d+>/g, '').trim();

    // Handle regular chat messages
    const response = await fetch(`${AGENT_URL}/${AGENT_ID}/message`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: content,
        userId: message.author.id,
        userName: message.author.username
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const rawResponse = await response.text();
    const data = JSON.parse(rawResponse) as ApiResponse[];

    let replyText: string | null = null;

    if (Array.isArray(data)) {
      const firstResponse = data[0];
      if (firstResponse) {
        replyText = firstResponse.text || firstResponse.message || firstResponse.response || null;
      }
    } else {
      const singleResponse = data as unknown as ApiResponse;
      replyText = singleResponse.text || singleResponse.message || singleResponse.response || null;
    }

    if (!replyText) {
      throw new Error('No valid response text found in API response');
    }

    // Check if this is a mention with !tweet command
    if (content.includes('!tweet')) {
      if (!hasRequiredRole) {
        await message.reply({
          content: `❌ You need the "${ALLOWED_ROLE_NAME}" role to use the !tweet command.`,
          failIfNotExists: false
        });
        return;
      }

      // Post bot's response to Twitter
      const tweetResult = await postToTwitter(replyText);
      
      if (tweetResult.success) {
        await message.reply(
          `✅ I've posted my response on Twitter!\n📱 View the tweet: https://twitter.com/x/status/${tweetResult.tweetId}`
        );
      } else {
        await message.reply(
          `❌ Failed to post my response to Twitter: ${tweetResult.error}`
        );
      }
    } else {
      // Send normal Discord reply for non-tweet mentions
      await message.reply({
        content: replyText,
        failIfNotExists: false
      });
    }

  } catch (error) {
    console.error('Error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    await message.reply({
      content: 'Sorry, I encountered an error processing your message. Error: ' + 
        (error instanceof Error ? error.message : 'Unknown error'),
      failIfNotExists: false
    });
  }
});

export async function initDiscordBot() {
  if (!process.env.DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN is not defined in environment variables');
  }

  try {
    await client.login(process.env.DISCORD_TOKEN);
    console.log('Discord bot initialized');
  } catch (error) {
    console.error('Failed to initialize Discord bot:', error);
    throw error;
  }
}

export { client };