import { NextResponse } from 'next/server'

const DID_API_KEY = process.env.DID_API_KEY
const DID_API_URL = process.env.DID_API_URL || 'https://api.d-id.com'

export async function POST() {
  if (!DID_API_KEY) {
    return NextResponse.json(
      { error: 'DID_API_KEY is not configured' },
      { status: 500 },
    )
  }

  try {
    // D-ID API key from studio is already in format "username:password"
    // We just need to base64 encode the entire key
    const base64Auth = Buffer.from(DID_API_KEY).toString('base64')
    
    console.log('Returning API key as client key for streaming...')
    
    // For D-ID streaming, we can use the API key directly
    // The streaming endpoints accept Basic auth with the API key
    // Return the base64-encoded API key as the "client key"
    return NextResponse.json({ clientKey: base64Auth })
  } catch (error) {
    console.error('Error getting D-ID client key:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get D-ID client key' },
      { status: 500 },
    )
  }
}

