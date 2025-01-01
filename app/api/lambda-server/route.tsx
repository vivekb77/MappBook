// /api/lambda-server.tsx
import type { NextApiRequest, NextApiResponse } from 'next';

type RequestData = {
  points: any[]; // Replace with your specific points type
  aspectRatio: string;
  mappbook_user_id: string;
  show_labels: boolean;
  animation_video_id: string;
};

type ResponseData = {
  success: boolean;
  data?: any;
  error?: string;
};

// You might want to move this to an environment variable
const LAMBDA_ENDPOINT = 'YOUR_LAMBDA_ENDPOINT';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      points,
      aspectRatio,
      mappbook_user_id,
      show_labels,
      animation_video_id,
    } = req.body as RequestData;

    // Validate required fields
    if (!points || !mappbook_user_id || !animation_video_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Make request to Lambda
    const lambdaResponse = await fetch(LAMBDA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        points,
        aspectRatio,
        mappbook_user_id,
        show_labels,
        animation_video_id,
      }),
    });

    if (!lambdaResponse.ok) {
      throw new Error(`Lambda returned ${lambdaResponse.status}`);
    }

    const data = await lambdaResponse.json();

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    console.error('Lambda server error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// Configure API route to handle larger payloads if needed
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};