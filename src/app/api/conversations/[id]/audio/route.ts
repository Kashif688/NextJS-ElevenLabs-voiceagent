import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return new NextResponse("API key not configured", { status: 500 });
  }

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`, {
      headers: {
        'xi-api-key': apiKey,
      }
    });

    if (!res.ok) {
      return new NextResponse("Audio recording not found for this conversation.", { status: 404 });
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `inline; filename="conversation_${conversationId}.mp3"`,
      }
    });
  } catch (error) {
    console.error("Error fetching audio:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
