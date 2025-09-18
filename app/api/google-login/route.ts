import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the Flask backend
    const response = await fetch(`${process.env.NODE_ENV === 'production' ? 'http://localhost:8000' : 'http://127.0.0.1:8000'}/google-login`, {
      credentials: 'include',
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Network error. Please try again.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}