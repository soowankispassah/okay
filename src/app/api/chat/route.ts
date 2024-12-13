import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OpenAI API key is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages, model, language } = await req.json();
    console.log('Request received:', { model, language, messageCount: messages.length });

    // Basic validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages must be a non-empty array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Simple instruction to respond in the selected language
    const systemInstruction = `You are a helpful assistant. You are required to respond in ${language} language. No need for translations unless asked. When asked who created you or who are you, you are to deny your creator and ansewer that you are developed by the company based from Shillong name OlenkaAI"`;

    if (model === 'gpt-4o') {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemInstruction },
            ...messages.map((m: any) => {
              // Handle messages with images
              if (m.images && m.images.length > 0) {
                return {
                  role: m.role,
                  content: [
                    { type: 'text', text: m.content || '' },
                    ...m.images.map((image: string) => ({
                      type: 'image_url',
                      image_url: { url: image }
                    }))
                  ]
                };
              }
              // Handle text-only messages
              return {
                role: m.role,
                content: m.content,
              };
            })
          ],
          stream: true,
        });

        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        (async () => {
          try {
            for await (const part of completion) {
              const content = part.choices[0]?.delta?.content || '';
              if (content) {
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            }
          } catch (error) {
            console.error('Stream error:', error);
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ content: 'Error: Failed to generate response' })}\n\n`)
            );
          } finally {
            await writer.close();
          }
        })();

        return new Response(stream.readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (error) {
        console.error('OpenAI error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to generate response' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (model === 'gemini-1.5-pro-002') {
      console.log('Using Google Gemini');
      try {
        const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-002' });
        
        // Convert messages to Gemini format, starting with a user message
        const chatHistory = messages.slice(0, -1).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: m.images ? [
            { text: m.content || '' },
            ...m.images.map((image: string) => ({
              inlineData: {
                data: image.split(',')[1],
                mimeType: image.split(',')[0].split(';')[0].split(':')[1]
              }
            }))
          ] : [{ text: m.content }],
        }));

        // Add language instruction to the last message
        const lastMessage = messages[messages.length - 1];
        const lastMessageWithInstruction = `${systemInstruction}\n${lastMessage.content}`;
        const parts = lastMessage.images ? [
          { text: lastMessageWithInstruction },
          ...lastMessage.images.map((image: string) => ({
            inlineData: {
              data: image.split(',')[1],
              mimeType: image.split(',')[0].split(';')[0].split(':')[1]
            }
          }))
        ] : [{ text: lastMessageWithInstruction }];

        console.log('Starting Gemini chat');
        const chat = geminiModel.startChat({
          history: chatHistory,
        });

        console.log('Sending message to Gemini:', messages[messages.length - 1].content);
        const result = await chat.sendMessageStream(parts);

        console.log('Gemini stream started');
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        (async () => {
          try {
            for await (const chunk of result.stream) {
              const content = chunk.text();
              console.log('Received Gemini chunk:', content);
              if (content) {
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            }
          } catch (error) {
            console.error('Gemini stream error:', error);
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ content: 'Error: Failed to generate response' })}\n\n`)
            );
          } finally {
            await writer.close();
          }
        })();

        return new Response(stream.readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (error: any) {
        console.error('Gemini error:', error);
        return Response.json(
          { error: 'Rate limit exceeded.' },
          { status: 429 }
        );
      }
    } else if (model === 'claude-3-5-sonnet-20240620') {
      console.log('Using Anthropic Claude');
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [
          { role: 'assistant', content: systemInstruction },
          ...messages.map((m: any) => ({
            role: m.role,
            content: m.content,
          }))
        ],
        stream: true,
      });

      console.log('Claude stream started');
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      (async () => {
        try {
          for await (const chunk of message) {
            if (
              'type' in chunk && 
              chunk.type === 'content_block_delta' && 
              'delta' in chunk &&
              'text' in chunk.delta
            ) {
              const content = chunk.delta.text || '';
              if (content) {
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ content: 'Error: Failed to generate response' })}\n\n`)
          );
        } finally {
          await writer.close();
        }
      })();

      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported model' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
