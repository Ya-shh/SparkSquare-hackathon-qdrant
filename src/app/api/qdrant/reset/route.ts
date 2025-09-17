import { NextResponse } from 'next/server';
import { forceResetQdrantCollections } from '@/lib/qdrant';

export async function POST() {
  try {
    console.log('🔄 Manual Qdrant reset requested');
    
    const success = await forceResetQdrantCollections();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Qdrant collections force reset successfully',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to force reset Qdrant collections',
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in manual Qdrant reset:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error during Qdrant reset',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
