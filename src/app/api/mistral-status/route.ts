import { NextResponse } from 'next/server';
import { getMistralRateLimitStatus, getEmbeddingProviderStatus } from '@/lib/qdrant';

export async function GET() {
  try {
    const status = getEmbeddingProviderStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        timestamp: new Date().toISOString(),
        rateLimitDetails: {
          ...status.mistralRateLimit,
          resetInSeconds: Math.ceil(status.mistralRateLimit.resetIn / 1000),
          backoffInSeconds: Math.ceil(status.mistralRateLimit.backoffIn / 1000),
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting Mistral status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get provider status',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
