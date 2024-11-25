import { Client, GatewayIntentBits } from 'discord.js';
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

const AGENT_ID = "b850bc30-45f8-0041-a00a-83df46d8555d";

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  try {
    console.log('----------------------');
    console.log('Received message:', message.content);

    const response = await fetch(`http://localhost:3000/${AGENT_ID}/message`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: message.content,
        userId: message.author.id,
        userName: message.author.username
      }),
    });

    console.log('API Response Status:', response.status);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const rawResponse = await response.text();
    console.log('Raw API Response:', rawResponse);

    const data = JSON.parse(rawResponse) as ApiResponse[];
    console.log('Parsed API Response:', data);

    let replyText: string | null = null;

    // Check if the response is an array
    if (Array.isArray(data)) {
      const firstResponse = data[0];
      if (firstResponse) {
        replyText = firstResponse.text || firstResponse.message || firstResponse.response || null;
      }
    } else {
      // If not an array, try as single object
      const singleResponse = data as unknown as ApiResponse;
      replyText = singleResponse.text || singleResponse.message || singleResponse.response || null;
    }

    // Check if we got a valid reply text
    if (!replyText) {
      throw new Error('No valid response text found in API response');
    }

    // Send the reply with the guaranteed string
    await message.reply({
      content: replyText,
      failIfNotExists: false
    });

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
  } finally {
    console.log('----------------------');
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