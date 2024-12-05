import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

interface TwitterPostResponse {
  success: boolean;
  tweetId?: string;
  error?: string;
}

export async function postToTwitter(content: string): Promise<TwitterPostResponse> {
  try {
    // Validate content length (Twitter's limit is 280 characters)
    if (!content) {
      return {
        success: false,
        error: 'Tweet content cannot be empty'
      };
    }

    if (content.length > 280) {
      content = content.substring(0, 277) + '...';
    }

    // Post to Twitter
    const tweet = await twitterClient.v2.tweet(content);
    
    if (!tweet.data?.id) {
      return {
        success: false,
        error: 'Failed to get tweet ID from response'
      };
    }

    return {
      success: true,
      tweetId: tweet.data.id
    };
  } catch (error) {
    console.error('Twitter posting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}