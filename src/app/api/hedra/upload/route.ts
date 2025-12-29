import { NextRequest, NextResponse } from 'next/server'

const HEDRA_API_KEY = process.env.HEDRA_API_KEY
const HEDRA_API_BASE_URL =
  process.env.HEDRA_API_BASE_URL || 'https://api.hedra.com/v1'
// Try different possible Hedra API endpoints
const HEDRA_UPLOAD_URL =
  process.env.HEDRA_UPLOAD_URL ||
  `${HEDRA_API_BASE_URL}/assets` ||
  `${HEDRA_API_BASE_URL}/web-app/public/assets` ||
  'https://api.hedra.com/web-app/public/assets'

export async function POST(request: NextRequest) {
  if (!HEDRA_API_KEY) {
    return NextResponse.json(
      { error: 'HEDRA_API_KEY is not configured' },
      { status: 500 },
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No avatar file provided' },
        { status: 400 },
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 },
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 },
      )
    }

    // Convert file to buffer for upload
    const buffer = Buffer.from(await file.arrayBuffer())

    // Try to upload to Hedra API first
    try {
      const hedraFormData = new FormData()
      hedraFormData.append('file', new Blob([buffer]), file.name)
      hedraFormData.append('type', 'avatar')
      hedraFormData.append('name', file.name)

      // Try different authentication methods
      const headers: HeadersInit = {}

      // Hedra might use Bearer token or X-API-Key
      if (HEDRA_API_KEY) {
        if (HEDRA_API_KEY.startsWith('Bearer ')) {
          headers['Authorization'] = HEDRA_API_KEY
        } else {
          headers['Authorization'] = `Bearer ${HEDRA_API_KEY}`
          headers['X-API-Key'] = HEDRA_API_KEY
        }
      }

      console.log('Attempting Hedra API upload to:', HEDRA_UPLOAD_URL)

      const response = await fetch(HEDRA_UPLOAD_URL, {
        method: 'POST',
        headers,
        body: hedraFormData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Hedra API error:', {
          status: response.status,
          statusText: response.statusText,
          url: HEDRA_UPLOAD_URL,
          error: errorText,
        })

        // Provide more specific error messages
        if (response.status === 404) {
          throw new Error(
            `Hedra API endpoint not found (404). The endpoint "${HEDRA_UPLOAD_URL}" may be incorrect. ` +
              `Avatars may need to be created through Hedra Studio first. ` +
              `Set HEDRA_AVATAR_ID environment variable with a pre-created avatar UUID instead.`,
          )
        } else if (response.status === 401 || response.status === 403) {
          throw new Error(
            `Hedra API authentication failed (${response.status}). Check your HEDRA_API_KEY.`,
          )
        }
        throw new Error(`Hedra API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // Extract avatar ID from response (Hedra returns UUID format)
      const avatarId =
        data.id || data.asset_id || data.avatar_id || data.avatarId

      // Validate that we got a valid UUID format
      // Hedra requires UUID format for avatar IDs
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!avatarId || !uuidPattern.test(avatarId)) {
        console.error('Invalid avatar ID format from Hedra API:', {
          avatarId,
          responseData: data,
        })
        throw new Error(
          'Hedra API returned invalid avatar ID format. Expected UUID.',
        )
      }

      return NextResponse.json({
        avatarId,
        url: data.url || data.asset_url || data.image_url,
        message: 'Avatar uploaded successfully to Hedra',
      })
    } catch (hedraError) {
      console.error('Hedra API upload failed:', hedraError)

      const errorMessage =
        hedraError instanceof Error ? hedraError.message : 'Unknown error'

      // Provide helpful guidance based on the error
      let hint =
        'Ensure HEDRA_API_KEY is set correctly and HEDRA_UPLOAD_URL points to the correct endpoint'

      if (errorMessage.includes('404')) {
        hint =
          'Hedra API upload endpoint not found. ' +
          'Avatars may need to be created through Hedra Studio first. ' +
          'Alternative: Set HEDRA_AVATAR_ID in your .env file with a pre-created avatar UUID from Hedra Studio.'
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        hint =
          'Check your HEDRA_API_KEY - authentication failed. Verify the API key is correct.'
      }

      return NextResponse.json(
        {
          error: 'Failed to upload avatar to Hedra API',
          message:
            'Avatar upload requires a valid Hedra API configuration. The agent needs a UUID-formatted avatar ID.',
          details: errorMessage,
          hint,
          alternative:
            'You can use a pre-created avatar from Hedra Studio by setting HEDRA_AVATAR_ID in your .env file',
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 },
    )
  }
}
