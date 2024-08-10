import { NextResponse } from 'next/server'; // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai'; // Import OpenAI library for interacting with the OpenAI API
import dotenv from 'dotenv';

dotenv.config();

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `Be a customer support assistant for 'Headstarter AI', you are helpful, creative, clever, and very friendly. It is designed to answer the queries of users on the Headstarted ai platform which is a software engineer training tool and community which uses modern AI tools to facilitate the learners.`;

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': '', // Optional, for including your app on openrouter.ai rankings.
      'X-Title': '', // Optional. Shows in rankings on openrouter.ai.
    },
  });
  const data = await req.json(); // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    messages: [{ role: 'system', content: systemPrompt }, ...data],
    stream: true,
  }); // Enable streaming responses

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
