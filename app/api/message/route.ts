import { NextResponse } from "next/server";

const AGENT_ID = "b850bc30-45f8-0041-a00a-83df46d8555d";

export async function POST(req: Request) {
  try {
    // Log the incoming request
    const body = await req.json();
    console.log('Received request body:', body);

    // Forward the request to your agent
    const response = await fetch(`http://localhost:3000/${AGENT_ID}/message`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: body.input,
        userId: body.userId || "user",
        userName: body.userName || "User",
      }),
    });

    if (!response.ok) {
      console.error('Agent API error:', response.status);
      throw new Error('Agent API error');
    }

    const data = await response.json();
    console.log('Agent response:', data);

    // Format the response to match what the front-end expects
    return NextResponse.json([{
      text: data.message || data.text || "No response",
      sender: "bot"
    }]);

  } catch (error) {
    console.error("Error in message API route:", error);
    return NextResponse.json([{ 
      text: "Failed to process message", 
      sender: "bot" 
    }], { 
      status: 500 
    });
  }
}