import { NextRequest, NextResponse } from 'next/server';
import { 
  indexMultiModalContent, 
  crossModalSearch,
  generateMultiModalEmbedding,
  generateAdvancedMultiModalEmbedding,
  processDocumentWithVisualUnderstanding,
  isQdrantReady 
} from '@/lib/qdrant';

interface MultiModalRequest {
  action: 'index' | 'search' | 'process' | 'advanced-index';
  content?: {
    id: string;
    text?: string;
    imageUrl?: string;
    documentUrl?: string;
    document?: Buffer | string;
    type: 'post' | 'comment' | 'document';
    metadata?: any;
  };
  query?: string | Buffer;
  targetModality?: 'text' | 'image' | 'document';
  limit?: number;
  scoreThreshold?: number;
  filters?: any;
  options?: {
    useAdvancedModel?: boolean;
    enableSemanticGapBridging?: boolean;
    extractImages?: boolean;
    extractTables?: boolean;
    extractMetadata?: boolean;
    enableOCR?: boolean;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: MultiModalRequest = await req.json();
    const { action, content, query, targetModality = 'text', limit = 10, scoreThreshold = 0.7, filters, options = {} } = body;

    // Check Qdrant availability
    const qdrantReady = await isQdrantReady();
    if (!qdrantReady) {
      return NextResponse.json(
        { error: 'Multi-modal service is temporarily unavailable' },
        { status: 503 }
      );
    }

    switch (action) {
      case 'index':
        if (!content) {
          return NextResponse.json(
            { error: 'Content is required for indexing' },
            { status: 400 }
          );
        }

        const indexResult = await indexMultiModalContent(content);
        
        return NextResponse.json({
          success: indexResult,
          message: indexResult ? 'Content indexed successfully' : 'Failed to index content',
          contentId: content.id,
          contentType: content.type,
          modalities: {
            text: !!content.text,
            image: !!content.imageUrl,
            document: !!content.documentUrl
          }
        });

      case 'advanced-index':
        if (!content) {
          return NextResponse.json(
            { error: 'Content is required for advanced indexing' },
            { status: 400 }
          );
        }

        const startTime = Date.now();
        
        // Process document with visual understanding if it's a document
        let processedContent = content;
        if (content.document) {
          const processed = await processDocumentWithVisualUnderstanding(content.document, {
            extractImages: options.extractImages,
            extractTables: options.extractTables,
            extractMetadata: options.extractMetadata,
            enableOCR: options.enableOCR
          });
          
          processedContent = {
            ...content,
            text: processed.text,
            metadata: {
              ...content.metadata,
              ...processed.metadata,
              visualElements: processed.visualElements
            }
          };
        }

        // Generate advanced embeddings
        const advancedEmbeddings = await generateAdvancedMultiModalEmbedding(
          {
            text: processedContent.text,
            image: processedContent.imageUrl,
            document: processedContent.document
          },
          {
            useAdvancedModel: options.useAdvancedModel,
            enableSemanticGapBridging: options.enableSemanticGapBridging,
            modality: targetModality
          }
        );

        const processingTime = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          message: 'Content processed and indexed with advanced features',
          contentId: content.id,
          contentType: content.type,
          processingTime: `${processingTime}ms`,
          embeddings: {
            modalities: Object.keys(advancedEmbeddings).filter(key => key !== 'metadata'),
            metadata: advancedEmbeddings.metadata
          },
          processedContent: {
            hasVisualElements: !!processedContent.metadata?.visualElements?.length,
            extractedMetadata: !!processedContent.metadata?.type,
            enhancedText: processedContent.text?.length > (content.text?.length || 0)
          }
        });

      case 'process':
        if (!content?.document) {
          return NextResponse.json(
            { error: 'Document is required for processing' },
            { status: 400 }
          );
        }

        const processStartTime = Date.now();
        const processed = await processDocumentWithVisualUnderstanding(content.document, {
          extractImages: options.extractImages,
          extractTables: options.extractTables,
          extractMetadata: options.extractMetadata,
          enableOCR: options.enableOCR
        });
        const processTime = Date.now() - processStartTime;

        return NextResponse.json({
          success: true,
          message: 'Document processed successfully',
          contentId: content.id,
          processingTime: `${processTime}ms`,
          results: {
            text: processed.text,
            metadata: processed.metadata,
            visualElements: processed.visualElements,
            images: processed.images?.length || 0,
            tables: processed.tables?.length || 0
          }
        });

      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for search' },
            { status: 400 }
          );
        }

        const searchStartTime = Date.now();
        const searchResults = await crossModalSearch(query, targetModality, {
          limit,
          scoreThreshold,
          filters
        });
        const searchTime = Date.now() - searchStartTime;

        return NextResponse.json({
          success: true,
          query: typeof query === 'string' ? query : '[Image Query]',
          targetModality,
          results: searchResults.map((result, index) => ({
            ...result,
            rank: index + 1,
            matchType: determineMatchType(result, query, targetModality)
          })),
          count: searchResults.length,
          metadata: {
            searchTime: `${searchTime}ms`,
            scoreThreshold,
            targetModality,
            queryType: typeof query === 'string' ? 'text' : 'binary',
            timestamp: new Date().toISOString()
          },
          insights: generateMultiModalInsights(searchResults, targetModality)
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "index", "search", "process", or "advanced-index"' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Multi-modal API error:', error);
    return NextResponse.json(
      { 
        error: 'Multi-modal operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Batch indexing endpoint
export async function PUT(req: NextRequest) {
  try {
    const { contents }: { contents: Array<{
      id: string;
      text?: string;
      imageUrl?: string;
      documentUrl?: string;
      type: 'post' | 'comment' | 'document';
      metadata?: any;
    }> } = await req.json();

    if (!contents || !Array.isArray(contents)) {
      return NextResponse.json(
        { error: 'Contents array is required for batch indexing' },
        { status: 400 }
      );
    }

    const qdrantReady = await isQdrantReady();
    if (!qdrantReady) {
      return NextResponse.json(
        { error: 'Multi-modal service is temporarily unavailable' },
        { status: 503 }
      );
    }

    const startTime = Date.now();
    const results = await Promise.allSettled(
      contents.map(content => indexMultiModalContent(content))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.filter(r => r.status === 'rejected' || !r.value).length;
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Batch indexing completed: ${successful} successful, ${failed} failed`,
      summary: {
        total: contents.length,
        successful,
        failed,
        successRate: `${((successful / contents.length) * 100).toFixed(1)}%`,
        processingTime: `${processingTime}ms`,
        averageTimePerItem: `${(processingTime / contents.length).toFixed(1)}ms`
      },
      details: results.map((result, index) => ({
        contentId: contents[index].id,
        success: result.status === 'fulfilled' && result.value,
        error: result.status === 'rejected' ? result.reason?.message : null
      }))
    });

  } catch (error) {
    console.error('Batch multi-modal indexing error:', error);
    return NextResponse.json(
      { 
        error: 'Batch indexing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for cross-modal search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const targetModality = (searchParams.get('modality') || 'text') as 'text' | 'image' | 'document';
    const limit = parseInt(searchParams.get('limit') || '10');
    const scoreThreshold = parseFloat(searchParams.get('threshold') || '0.7');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const qdrantReady = await isQdrantReady();
    if (!qdrantReady) {
      return NextResponse.json(
        { error: 'Multi-modal service is temporarily unavailable' },
        { status: 503 }
      );
    }

    const startTime = Date.now();
    const results = await crossModalSearch(query, targetModality, {
      limit,
      scoreThreshold
    });
    const searchTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query,
      targetModality,
      results: results.map((result, index) => ({
        ...result,
        rank: index + 1,
        matchType: determineMatchType(result, query, targetModality)
      })),
      count: results.length,
      metadata: {
        searchTime: `${searchTime}ms`,
        scoreThreshold,
        targetModality,
        timestamp: new Date().toISOString()
      },
      insights: generateMultiModalInsights(results, targetModality)
    });

  } catch (error) {
    console.error('Multi-modal search error:', error);
    return NextResponse.json(
      { 
        error: 'Multi-modal search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Determine the type of match for cross-modal results
function determineMatchType(
  result: any, 
  query: string | Buffer, 
  targetModality: string
): string {
  const hasText = !!result.text;
  const hasImage = !!result.imageUrl;
  const hasDocument = !!result.documentUrl;
  
  const queryType = typeof query === 'string' ? 'text' : 'image';
  
  if (queryType === 'text' && targetModality === 'image') {
    return 'text-to-image';
  } else if (queryType === 'image' && targetModality === 'text') {
    return 'image-to-text';
  } else if (queryType === 'text' && targetModality === 'document') {
    return 'text-to-document';
  } else if (queryType === targetModality) {
    return 'same-modality';
  } else {
    return 'cross-modal';
  }
}

// Generate insights for multi-modal search results
function generateMultiModalInsights(results: any[], targetModality: string): any {
  if (results.length === 0) {
    return {
      summary: 'No cross-modal matches found',
      suggestions: [
        'Try different search terms',
        'Switch target modality',
        'Lower the score threshold'
      ]
    };
  }

  const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
  const modalityDistribution = {
    text: results.filter(r => r.text).length,
    image: results.filter(r => r.imageUrl).length,
    document: results.filter(r => r.documentUrl).length
  };

  const contentTypes = [...new Set(results.map(r => r.type).filter(Boolean))];
  const highQualityMatches = results.filter(r => (r.score || 0) > 0.8).length;

  return {
    summary: `Found ${results.length} cross-modal matches targeting ${targetModality}`,
    quality: {
      averageScore: avgScore,
      highQualityMatches,
      qualityDistribution: {
        excellent: results.filter(r => (r.score || 0) > 0.9).length,
        good: results.filter(r => (r.score || 0) > 0.7 && (r.score || 0) <= 0.9).length,
        fair: results.filter(r => (r.score || 0) > 0.5 && (r.score || 0) <= 0.7).length
      }
    },
    modalityDistribution,
    contentTypes,
    targetModality,
    performance: avgScore > 0.8 ? 'excellent' : avgScore > 0.6 ? 'good' : 'fair',
    recommendations: generateModalityRecommendations(modalityDistribution, targetModality, avgScore)
  };
}

// Generate recommendations for improving multi-modal search
function generateModalityRecommendations(
  distribution: any, 
  targetModality: string, 
  avgScore: number
): string[] {
  const recommendations: string[] = [];

  if (avgScore < 0.6) {
    recommendations.push('Consider using more descriptive search terms');
    recommendations.push('Try searching with different modalities');
  }

  if (distribution[targetModality] === 0) {
    recommendations.push(`No ${targetModality} content found - try a different target modality`);
  }

  if (distribution.text > 0 && targetModality !== 'text') {
    recommendations.push('Text content available - consider text-based search');
  }

  if (distribution.image > 0 && targetModality !== 'image') {
    recommendations.push('Image content available - consider visual search');
  }

  if (distribution.document > 0 && targetModality !== 'document') {
    recommendations.push('Document content available - consider document search');
  }

  return recommendations.slice(0, 3);
}
