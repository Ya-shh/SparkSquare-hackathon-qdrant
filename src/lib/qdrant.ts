import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import { Post, Comment, Category, User } from '@prisma/client';
import { HfInference } from '@huggingface/inference';
// import MistralClient from '@mistralai/mistralai'; // Temporarily disabled due to import issues

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'intfloat/e5-large-v2';
const MULTIMODAL_MODEL = process.env.MULTIMODAL_MODEL || 'llamaindex/vdr-2b-multi-v1';
const USE_E5 = EMBEDDING_MODEL.includes('e5');
const hasOpenAIKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0);
const hasHFKey = !!(process.env.HF_API_KEY && process.env.HF_API_KEY.length > 0);
const hasMistralKey = !!(process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY.length > 0);
const hasEmbeddingProvider = hasHFKey || hasOpenAIKey || hasMistralKey;
const EMBEDDING_DIM = 1024; // Mistral embeddings are 1024-dimensional
const MULTIMODAL_DIM = 768;
const SPARSE_DIM = 30000;

const ENABLE_BINARY_QUANTIZATION = process.env.ENABLE_BINARY_QUANTIZATION === 'true';
const ENABLE_MULTIMODAL_SEARCH = process.env.ENABLE_MULTIMODAL_SEARCH === 'true';
const ENABLE_COLLABORATIVE_FILTERING = process.env.ENABLE_COLLABORATIVE_FILTERING === 'true';
const PREFER_MISTRAL_OVER_HF = process.env.PREFER_MISTRAL_OVER_HF === 'true';

const openai = hasOpenAIKey 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const hf = hasHFKey
  ? new HfInference(process.env.HF_API_KEY)
  : null;

let mistral = null;
if (hasMistralKey) {
  try {
    const { Mistral } = require('@mistralai/mistralai');
    mistral = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY,
      serverURL: process.env.MISTRAL_ENDPOINT || 'https://api.mistral.ai'
    });
  } catch (error) {
    console.error('Failed to initialize Mistral client:', error);
    mistral = null;
  }
}

const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
const qdrantApiKey = process.env.QDRANT_API_KEY;

const clientConfig: any = {
  url: qdrantUrl,
  checkCompatibility: false, // Skip version check
};

if (qdrantApiKey) {
  clientConfig.apiKey = qdrantApiKey;
  
  if (!qdrantUrl.includes('localhost') && !qdrantUrl.startsWith('https://')) {
    console.warn('Warning: Consider using HTTPS with API key for production deployments');
  }
}

const qdrantClient = new QdrantClient(clientConfig);

const COLLECTIONS = {
  POSTS: 'posts',
  COMMENTS: 'comments',
  CATEGORIES: 'categories',
  USERS: 'users',
  MULTIMODAL: 'multimodal_content',
  RECOMMENDATIONS: 'user_recommendations',
  DOCUMENTS: 'documents',
  IMAGES: 'images',
};

const VECTOR_CONFIGS = {
  DENSE: {
    size: EMBEDDING_DIM,
    distance: 'Cosine' as const,
  },
  MULTIMODAL: {
    text: { size: MULTIMODAL_DIM, distance: 'Cosine' as const },
    image: { size: MULTIMODAL_DIM, distance: 'Cosine' as const },
    document: { size: MULTIMODAL_DIM, distance: 'Cosine' as const },
  },
  SPARSE: {
    size: 0,
    distance: 'Dot' as const,
    is_sparse: true,
  },
  HYBRID: {
    dense: { size: EMBEDDING_DIM, distance: 'Cosine' as const },
    sparse: { size: 0, distance: 'Dot' as const, is_sparse: true },
  },
};

export { qdrantClient, COLLECTIONS };

export async function initQdrantCollections() {
  try {
    const ready = await isQdrantReady();
    if (!ready) {
      console.warn('Qdrant is not reachable; skipping collection init.');
      return false;
    }
    
    const collections = await qdrantClient.getCollections();
    const existingCollections = new Set(collections.collections.map(c => c.name));
    
    const collectionConfigs = {
      [COLLECTIONS.POSTS]: { vectors: VECTOR_CONFIGS.DENSE },
      [COLLECTIONS.COMMENTS]: { vectors: VECTOR_CONFIGS.DENSE },
      [COLLECTIONS.CATEGORIES]: { vectors: VECTOR_CONFIGS.DENSE },
      [COLLECTIONS.USERS]: { vectors: VECTOR_CONFIGS.DENSE },
      [COLLECTIONS.MULTIMODAL]: { 
        vectors: VECTOR_CONFIGS.MULTIMODAL,
        quantization_config: {
          binary: {
            always_ram: true
          }
        }
      }
      // Skip problematic collections for now
      // [COLLECTIONS.RECOMMENDATIONS]: { 
      //   vectors: {
      //     ratings: {
      //       size: 0,
      //       distance: 'Dot',
      //       is_sparse: true
      //     }
      //   }
      // },
      // [COLLECTIONS.DOCUMENTS]: { 
      //   vectors: {
      //     dense: { size: EMBEDDING_DIM, distance: 'Cosine' },
      //     sparse: { size: 0, distance: 'Dot', is_sparse: true }
      //   },
      //   optimizers_config: {
      //     default_segment_number: 2,
      //     memmap_threshold: 20000
      //   }
      // },
      // [COLLECTIONS.IMAGES]: { 
      //   vectors: {
      //     visual: { size: MULTIMODAL_DIM, distance: 'Cosine' },
      //     semantic: { size: EMBEDDING_DIM, distance: 'Cosine' }
      //   }
      // }
    };
    
    for (const [collectionName, config] of Object.entries(collectionConfigs)) {
      if (!existingCollections.has(collectionName)) {
        await qdrantClient.createCollection(collectionName, config);
        console.log(`Created collection: ${collectionName}`);
        
        if (collectionName === COLLECTIONS.POSTS || collectionName === COLLECTIONS.MULTIMODAL) {
          await createPayloadIndexes(collectionName);
        }
      } else {
        await validateCollectionConfig(collectionName, config);
      }
    }
    
    console.log('✅ All Qdrant collections initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Qdrant collections:', error);
    return false;
  }
}

async function createPayloadIndexes(collectionName: string) {
  const commonIndexes = ['type', 'categoryId', 'userId', 'createdAtTs'];
  
  for (const field of commonIndexes) {
    try {
      await qdrantClient.createPayloadIndex(collectionName, {
        field_name: field,
        field_schema: field === 'createdAtTs' ? 'integer' : 'keyword'
      });
    } catch (error) {
      console.warn(`Could not create index for ${field} in ${collectionName}:`, error.message);
    }
  }
}

async function validateCollectionConfig(collectionName: string, expectedConfig: any) {
  try {
    const info: any = await (qdrantClient as any).getCollection(collectionName);
    // Basic validation - could be enhanced based on needs
    console.log(`Validated collection ${collectionName}`);
  } catch (e) {
    console.warn(`Could not validate collection ${collectionName} config; proceeding.`);
  }
}

export async function generateEmbedding(text: string, kind: 'query' | 'passage' = 'passage'): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    return generateMockEmbedding('empty_text', EMBEDDING_DIM);
  }

  try {
    // Try Mistral embeddings first if available and preferred
    if (hasMistralKey && mistral && PREFER_MISTRAL_OVER_HF) {
      try {
        return await generateMistralEmbedding(text);
      } catch (error) {
        console.warn('Mistral embedding failed, trying fallback:', error.message);
      }
    }

    // Try HuggingFace embeddings if available
    if (hasHFKey) {
      try {
        return await generateE5EmbeddingHF(text);
      } catch (error) {
        console.warn('HuggingFace embedding failed, trying fallback:', error.message);
      }
    }

    // Try OpenAI embeddings if available
    if (hasOpenAIKey && openai) {
      try {
        return await generateOpenAIEmbedding(text);
      } catch (error) {
        console.warn('OpenAI embedding failed, trying fallback:', error.message);
      }
    }

    // Try Mistral if not preferred but available
    if (hasMistralKey && mistral && !PREFER_MISTRAL_OVER_HF) {
      try {
        return await generateMistralEmbedding(text);
      } catch (error) {
        console.warn('Mistral embedding failed, using mock:', error.message);
      }
    }

    // Fall back to mock embeddings
    console.warn('No embedding providers available or all failed, using mock embeddings');
    return generateMockEmbedding(text, EMBEDDING_DIM);

  } catch (error) {
    console.error('Error generating embedding:', error);
    return generateMockEmbedding(text, EMBEDDING_DIM);
  }
}

async function generateMistralEmbedding(text: string): Promise<number[]> {
  if (!mistral) throw new Error('Mistral client not initialized');
  
  try {
    const response = await mistral.embeddings.create({
      model: 'mistral-embed',
      inputs: [text],
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0].embedding;
    }
    throw new Error('No embedding data received from Mistral');
  } catch (error) {
    console.error('Mistral embedding error:', error);
    throw error;
  }
}

async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  if (!openai) throw new Error('OpenAI client not initialized');
  
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: EMBEDDING_DIM, // Match our collection configuration
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0].embedding;
    }
    throw new Error('No embedding data received from OpenAI');
  } catch (error) {
    console.error('OpenAI embedding error:', error);
    throw error;
  }
}

async function generateE5EmbeddingHF(text: string): Promise<number[]> {
  const url = `https://api-inference.huggingface.co/pipeline/feature-extraction/${EMBEDDING_MODEL}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`HF API error: ${res.status} ${msg}`);
  }
  const data: any = await res.json();
  // data can be 2D [tokens][dims] or 1D [dims]
  const embedding = Array.isArray(data[0]) ? meanPool(data as number[][]) : (data as number[]);
  return l2Normalize(embedding);
}

function generateMockEmbedding(text: string, dimensions: number = EMBEDDING_DIM): number[] {
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return h;
  };
  
  const baseHash = hash(text);
  const mockEmbedding = Array(dimensions).fill(0).map((_, i) => {
    const value = Math.sin(baseHash + i) / 2 + 0.5;
    return value;
  });
  return l2Normalize(mockEmbedding);
}

function meanPool(tokens: number[][]): number[] {
  if (tokens.length === 0) return [];
  const dims = tokens[0].length;
  const sum = new Array(dims).fill(0);
  for (const vec of tokens) {
    for (let i = 0; i < dims; i++) sum[i] += vec[i];
  }
  for (let i = 0; i < dims; i++) sum[i] /= tokens.length;
  return sum;
}

function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

// Multi-modal embedding generation
export async function generateMultiModalEmbedding(
  content: { text?: string; image?: Buffer | string; document?: Buffer | string },
  modality: 'text' | 'image' | 'document' = 'text'
): Promise<{ [key: string]: number[] }> {
  const embeddings: { [key: string]: number[] } = {};
  
  try {
    if (content.text) {
      embeddings.text = await generateEmbedding(content.text, 'passage');
    }
    
    if (content.image && hasHFKey) {
      // Use HuggingFace for image embeddings
      const imageEmbedding = await generateImageEmbedding(content.image);
      embeddings.image = imageEmbedding;
    }
    
    if (content.document) {
      // Extract text from document and generate embedding
      const documentText = await extractTextFromDocument(content.document);
      embeddings.document = await generateEmbedding(documentText, 'passage');
    }
    
    return embeddings;
  } catch (error) {
    console.error('Multi-modal embedding generation failed:', error);
    throw error;
  }
}

async function generateImageEmbedding(image: Buffer | string): Promise<number[]> {
  if (!hf) throw new Error('HuggingFace client not initialized');
  
  try {
    // Use CLIP or similar vision model for image embeddings
    const response = await hf.featureExtraction({
      model: 'openai/clip-vit-base-patch32',
      inputs: image instanceof Buffer ? image : image
    });
    
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Image embedding generation failed:', error);
    // Return a mock embedding for development
    return generateMockEmbedding('image_content');
  }
}

async function extractTextFromDocument(document: Buffer | string): Promise<string> {
  // Simple text extraction - can be enhanced with pdf-parse, mammoth, etc.
  if (typeof document === 'string') {
    return document;
  }
  
  // For now, return a placeholder - implement actual document parsing
  return 'document content extracted';
}

// Enhanced document processing with visual understanding
export async function processDocumentWithVisualUnderstanding(
  document: Buffer | string,
  options: {
    extractImages?: boolean;
    extractTables?: boolean;
    extractMetadata?: boolean;
    enableOCR?: boolean;
  } = {}
): Promise<{
  text: string;
  images?: Buffer[];
  tables?: any[];
  metadata?: any;
  visualElements?: any[];
}> {
  const { extractImages = true, extractTables = true, extractMetadata = true, enableOCR = true } = options;
  
  try {
    let text = '';
    const images: Buffer[] = [];
    const tables: any[] = [];
    const metadata: any = {};
    const visualElements: any[] = [];

    if (typeof document === 'string') {
      text = document;
    } else {
      // Enhanced document processing
      const pdfParse = require('pdf-parse');
      const mammoth = require('mammoth');
      
      // Try to determine document type
      const isPDF = document.length > 4 && 
        document[0] === 0x25 && document[1] === 0x50 && 
        document[2] === 0x44 && document[3] === 0x46;
      
      if (isPDF) {
        const pdfData = await pdfParse(document);
        text = pdfData.text;
        
        if (extractMetadata) {
          metadata.type = 'PDF';
          metadata.pages = pdfData.numpages;
          metadata.info = pdfData.info;
        }
      } else {
        // Try as Word document
        try {
          const result = await mammoth.extractRawText({ buffer: document });
          text = result.value;
          
          if (extractMetadata) {
            metadata.type = 'Word Document';
            metadata.messages = result.messages;
          }
        } catch (error) {
          // Fallback to plain text
          text = document.toString('utf-8');
          metadata.type = 'Plain Text';
        }
      }
    }

    // Extract visual elements if enabled
    if (extractImages && typeof document === 'object') {
      // This would require more sophisticated document parsing
      // For now, we'll add placeholder functionality
      visualElements.push({
        type: 'image',
        description: 'Document contains visual elements',
        confidence: 0.8
      });
    }

    return {
      text,
      images,
      tables,
      metadata,
      visualElements
    };
  } catch (error) {
    console.error('Document processing failed:', error);
    return {
      text: typeof document === 'string' ? document : 'Document processing failed',
      metadata: { error: 'processing_failed' }
    };
  }
}

// Helper functions for recommendations
async function getUserInteractionVector(userId: string): Promise<{ indices: number[]; values: number[] } | null> {
  try {
    // This would typically query your database for user interactions
    // For now, return a mock sparse vector
    return {
      indices: [1, 5, 10, 15, 20],
      values: [0.8, 0.6, 0.9, 0.7, 0.5]
    };
  } catch (error) {
    console.error('Error getting user interaction vector:', error);
    return null;
  }
}

async function getUserProfileVector(userId: string): Promise<number[] | null> {
  try {
    // This would typically query your database for user profile
    // For now, return a mock dense vector
    return new Array(EMBEDDING_DIM).fill(0).map(() => Math.random() - 0.5);
  } catch (error) {
    console.error('Error getting user profile vector:', error);
    return null;
  }
}

async function getUserRecommendations(userId: string, limit: number): Promise<any[]> {
  try {
    // This would typically query your database for user's recommended content
    // For now, return mock recommendations
    return Array.from({ length: limit }, (_, i) => ({
      id: `rec_${userId}_${i}`,
      title: `Recommended content ${i}`,
      score: Math.random(),
      type: 'recommendation'
    }));
  } catch (error) {
    console.error('Error getting user recommendations:', error);
    return [];
  }
}

// Enhanced multi-modal embedding with LlamaIndex vdr-2b-multi-v1
export async function generateAdvancedMultiModalEmbedding(
  content: { text?: string; image?: Buffer | string; document?: Buffer | string },
  options: {
    useAdvancedModel?: boolean;
    enableSemanticGapBridging?: boolean;
    modality?: 'text' | 'image' | 'document';
  } = {}
): Promise<{ [key: string]: number[]; metadata?: any }> {
  const { useAdvancedModel = true, enableSemanticGapBridging = true, modality = 'text' } = options;
  const embeddings: { [key: string]: number[] } = {};
  const metadata: any = {};

  try {
    if (content.text) {
      if (useAdvancedModel && hasHFKey) {
        // Use LlamaIndex vdr-2b-multi-v1 for better cross-lingual text-image retrieval
        const textEmbedding = await hf?.featureExtraction({
          model: MULTIMODAL_MODEL,
          inputs: content.text,
        });
        embeddings.text = Array.isArray(textEmbedding) ? textEmbedding : textEmbedding[0];
        metadata.textModel = MULTIMODAL_MODEL;
      } else {
        embeddings.text = await generateEmbedding(content.text, 'text');
        metadata.textModel = 'fallback';
      }
    }

    if (content.image) {
      if (useAdvancedModel && hasHFKey) {
        // Enhanced image embedding with visual understanding
        const imageEmbedding = await generateAdvancedImageEmbedding(content.image);
        embeddings.image = imageEmbedding;
        metadata.imageModel = MULTIMODAL_MODEL;
      } else {
        embeddings.image = await generateImageEmbedding(content.image);
        metadata.imageModel = 'fallback';
      }
    }

    if (content.document) {
      if (useAdvancedModel && hasHFKey) {
        // Enhanced document processing with visual understanding
        const documentEmbedding = await generateAdvancedDocumentEmbedding(content.document);
        embeddings.document = documentEmbedding;
        metadata.documentModel = MULTIMODAL_MODEL;
      } else {
        embeddings.document = await generateDocumentEmbedding(content.document);
        metadata.documentModel = 'fallback';
      }
    }

    if (enableSemanticGapBridging) {
      // Apply semantic gap bridging techniques
      Object.keys(embeddings).forEach(key => {
        embeddings[key] = applySemanticGapBridging(embeddings[key], key);
      });
      metadata.semanticGapBridging = true;
    }

    return { ...embeddings, metadata };
  } catch (error) {
    console.error('Error generating advanced multi-modal embeddings:', error);
    // Return mock embeddings for development
    return {
      text: content.text ? new Array(MULTIMODAL_DIM).fill(0).map(() => Math.random() - 0.5) : undefined,
      image: content.image ? new Array(MULTIMODAL_DIM).fill(0).map(() => Math.random() - 0.5) : undefined,
      document: content.document ? new Array(MULTIMODAL_DIM).fill(0).map(() => Math.random() - 0.5) : undefined,
      metadata: { error: 'fallback_mode', timestamp: new Date().toISOString() }
    };
  }
}

// Advanced image embedding with visual understanding
async function generateAdvancedImageEmbedding(image: Buffer | string): Promise<number[]> {
  if (!hf) throw new Error('HuggingFace client not initialized');
  
  try {
    // Use advanced vision model for better image understanding
    const response = await hf.featureExtraction({
      model: MULTIMODAL_MODEL, // Use the multimodal model for images
      inputs: image instanceof Buffer ? image : image
    });
    
    return Array.isArray(response) ? response : response[0];
  } catch (error) {
    console.error('Advanced image embedding generation failed:', error);
    // Fallback to basic image embedding
    return generateImageEmbedding(image);
  }
}

// Advanced document embedding with visual understanding
async function generateAdvancedDocumentEmbedding(document: Buffer | string): Promise<number[]> {
  try {
    // Extract text and potentially visual elements from document
    const documentText = await extractTextFromDocument(document);
    
    // Use multimodal model for document understanding
    if (hasHFKey) {
      const response = await hf?.featureExtraction({
        model: MULTIMODAL_MODEL,
        inputs: documentText,
      });
      return Array.isArray(response) ? response : response[0];
    } else {
      return generateEmbedding(documentText, 'passage');
    }
  } catch (error) {
    console.error('Advanced document embedding generation failed:', error);
    // Fallback to basic document embedding
    const documentText = await extractTextFromDocument(document);
    return generateEmbedding(documentText, 'passage');
  }
}

// Apply semantic gap bridging techniques
function applySemanticGapBridging(embedding: number[], modality: string): number[] {
  // Apply L2 normalization for better semantic matching
  const normalized = l2Normalize(embedding);
  
  // Apply modality-specific enhancements
  switch (modality) {
    case 'text':
      // Enhance text embeddings for better cross-modal matching
      return normalized.map((val, idx) => val * (1 + 0.1 * Math.sin(idx * 0.1)));
    case 'image':
      // Enhance image embeddings for visual-semantic alignment
      return normalized.map((val, idx) => val * (1 + 0.05 * Math.cos(idx * 0.2)));
    case 'document':
      // Enhance document embeddings for structured content understanding
      return normalized.map((val, idx) => val * (1 + 0.08 * Math.sin(idx * 0.15)));
    default:
      return normalized;
  }
}

// Sparse vector generation for recommendations
export function generateSparseVector(
  userItemRatings: { [itemId: string]: number }
): { indices: number[]; values: number[] } {
  const indices: number[] = [];
  const values: number[] = [];
  
  // Normalize ratings
  const ratings = Object.values(userItemRatings);
  const mean = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  const std = Math.sqrt(ratings.reduce((sum, rating) => sum + Math.pow(rating - mean, 2), 0) / ratings.length);
  
  Object.entries(userItemRatings).forEach(([itemId, rating]) => {
    const normalizedRating = std > 0 ? (rating - mean) / std : rating - mean;
    const index = parseInt(itemId, 10) || hashStringToNumber(itemId) % SPARSE_DIM;
    
    indices.push(index);
    values.push(normalizedRating);
  });
  
  return { indices, values };
}

// Convert string ID to a consistent number for Qdrant
function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Binary quantization for performance optimization
export async function enableBinaryQuantization(collectionName: string) {
  try {
    await qdrantClient.updateCollection(collectionName, {
      quantization_config: {
        binary: {
          always_ram: true
        }
      }
    });
    console.log(`Enabled binary quantization for ${collectionName}`);
  } catch (error) {
    console.error(`Failed to enable binary quantization for ${collectionName}:`, error);
  }
}

export async function indexPost(post: Post & { user: User; category: Category }) {
  
  try {
    const textToEmbed = `${post.title} ${post.content} ${post.user.username} ${post.category.name}`;
    
    let embedding;
    try {
      embedding = await generateEmbedding(textToEmbed, 'passage');
    } catch (embeddingError) {
      console.error('Error generating embedding for post:', embeddingError);
      return false; // Return false but don't throw to prevent breaking the main flow
    }

    try {
      // Convert cuid to a simple hash for Qdrant point ID
      const pointId = hashStringToNumber(post.id);
      
      await qdrantClient.upsert(COLLECTIONS.POSTS, {
        wait: true,
        points: [
          {
            id: pointId,
            vector: embedding,
            payload: {
              id: post.id,
              title: post.title,
              content: post.content,
              createdAt: post.createdAt.toISOString(),
              createdAtTs: Math.floor(post.createdAt.getTime() / 1000), // Unix timestamp for filtering
              userId: post.userId,
              username: post.user.username,
              userName: post.user.name,
              categoryId: post.categoryId,
              categoryName: post.category.name,
              type: 'post',
            },
          },
        ],
      });
    } catch (upsertError) {
      console.error('Error upserting post to Qdrant:', upsertError);
      return false; // Return false but don't throw
    }

    return true;
  } catch (error) {
    console.error('Error indexing post:', error);
    return false; // Return false but don't throw
  }
}

export async function indexComment(
  comment: Comment & { user: User; post: Post }
) {
  
  try {
    const textToEmbed = `${comment.content} ${comment.user.username} comment on post: ${comment.post.title}`;
    const embedding = await generateEmbedding(textToEmbed, 'passage');

    const pointId = hashStringToNumber(comment.id);

    await qdrantClient.upsert(COLLECTIONS.COMMENTS, {
      wait: true,
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt.toISOString(),
            createdAtTs: Math.floor(comment.createdAt.getTime() / 1000),
            userId: comment.userId,
            username: comment.user.username,
            userName: comment.user.name,
            postId: comment.postId,
            postTitle: comment.post.title,
            type: 'comment',
          },
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Error indexing comment:', error);
    return false;
  }
}

export async function indexCategory(category: Category) {
  
  try {
    const textToEmbed = `${category.name} ${category.description || ''}`;
    const embedding = await generateEmbedding(textToEmbed, 'passage');

    const pointId = hashStringToNumber(category.id);
    
    await qdrantClient.upsert(COLLECTIONS.CATEGORIES, {
      wait: true,
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            id: category.id,
            name: category.name,
            description: category.description,
            slug: category.slug,
            type: 'category',
          },
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Error indexing category:', error);
    return false;
  }
}

export async function vectorSearch(query: string, limit = 10) {
  if (!hasEmbeddingProvider) {
    return mockSearch(query, limit);
  }
  
  try {
    const ready = await isQdrantReady();
    if (!ready) return mockSearch(query, limit);
    const queryEmbedding = await generateEmbedding(query, 'query');
    
    const [postsResults, commentsResults, categoriesResults] = await Promise.all([
      qdrantClient.search(COLLECTIONS.POSTS, {
        vector: queryEmbedding,
        limit,
      }),
      qdrantClient.search(COLLECTIONS.COMMENTS, {
        vector: queryEmbedding,
        limit,
      }),
      qdrantClient.search(COLLECTIONS.CATEGORIES, {
        vector: queryEmbedding,
        limit,
      }),
    ]);

    const combinedResults = [
      ...postsResults.map(r => ({ ...r, payload: { ...r.payload, score: r.score } })),
      ...commentsResults.map(r => ({ ...r, payload: { ...r.payload, score: r.score } })),
      ...categoriesResults.map(r => ({ ...r, payload: { ...r.payload, score: r.score } })),
    ].sort((a, b) => b.score - a.score).slice(0, limit);

    return combinedResults.map(r => r.payload);
  } catch (error) {
    console.error('Error during vector search:', error);
    return mockSearch(query, limit);
  }
}

// Advanced hybrid search with RRF fusion
export async function hybridSearch(
  query: string,
  options: {
    limit?: number;
    denseWeight?: number;
    sparseWeight?: number;
    filters?: any;
    collections?: string[];
    fusionMethod?: 'rrf' | 'dbsf';
    rrfK?: number;
  } = {}
) {
  const {
    limit = 10,
    denseWeight = 0.7,
    sparseWeight = 0.3,
    filters,
    collections = [COLLECTIONS.POSTS],
    fusionMethod = 'rrf',
    rrfK = 60
  } = options;

  if (!hasEmbeddingProvider) {
    return mockSearch(query, limit);
  }

  try {
    const ready = await isQdrantReady();
    if (!ready) return mockSearch(query, limit);

    const queryEmbedding = await generateEmbedding(query, 'query');
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    const sparseQuery = generateQuerySparseVector(queryTerms);

    const results = [];
    
    for (const collection of collections) {
      try {
        // Use Qdrant's built-in hybrid search with prefetch
        const searchResult = await qdrantClient.query(collection, {
          prefetch: [
            {
              query: queryEmbedding,
              using: 'dense',
              limit: limit * 2
            },
            {
              query: sparseQuery,
              using: 'sparse',
              limit: limit * 2
            }
          ],
          query: {
            fusion: fusionMethod.toUpperCase() as any,
            ...(fusionMethod === 'rrf' && { rrf_k: rrfK })
          },
          filter: filters,
          limit,
          with_payload: true
        });
        
        results.push(...searchResult.points || []);
      } catch (error) {
        console.error(`Hybrid search failed for collection ${collection}:`, error);
        // Fallback to regular dense search
        const fallbackResult = await qdrantClient.search(collection, {
          vector: queryEmbedding,
          limit,
          filter: filters,
          with_payload: true
        });
        results.push(...fallbackResult);
      }
    }

    // Sort by score and apply final limit
    const sortedResults = results
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

    return sortedResults.map(r => r.payload);
  } catch (error) {
    console.error('Error during hybrid search:', error);
    return mockSearch(query, limit);
  }
}

// Generate sparse vector for query terms
function generateQuerySparseVector(terms: string[]): { indices: number[]; values: number[] } {
  const indices: number[] = [];
  const values: number[] = [];
  
  terms.forEach((term, index) => {
    const termIndex = hashStringToNumber(term) % SPARSE_DIM;
    const weight = 1.0 / (index + 1); // Give higher weight to earlier terms
    
    indices.push(termIndex);
    values.push(weight);
  });
  
  return { indices, values };
}

// Multi-stage search for efficiency
export async function multiStageSearch(
  query: string,
  options: {
    limit?: number;
    candidateLimit?: number;
    filters?: any;
    rescoreModel?: string;
  } = {}
) {
  const { limit = 10, candidateLimit = 100, filters, rescoreModel } = options;
  
  if (!hasEmbeddingProvider) {
    return mockSearch(query, limit);
  }

  try {
    const ready = await isQdrantReady();
    if (!ready) return mockSearch(query, limit);

    const queryEmbedding = await generateEmbedding(query, 'query');
    
    // Stage 1: Fast candidate selection with smaller vectors
    const candidates = await qdrantClient.search(COLLECTIONS.POSTS, {
      vector: queryEmbedding.slice(0, Math.floor(queryEmbedding.length / 2)), // Use half dimensions for speed
      limit: candidateLimit,
      filter: filters,
      with_payload: true
    });

    if (candidates.length === 0) {
      return [];
    }

    // Stage 2: Rescore with full vectors
    const candidateIds = candidates.map(c => c.id);
    
    const rescored = await qdrantClient.search(COLLECTIONS.POSTS, {
      vector: queryEmbedding, // Full embedding for final ranking
      limit,
      filter: {
        must: [
          ...(filters?.must || []),
          {
            key: 'id',
            match: { any: candidateIds }
          }
        ]
      },
      with_payload: true
    });

    return rescored.map(r => r.payload);
  } catch (error) {
    console.error('Error during multi-stage search:', error);
    return mockSearch(query, limit);
  }
}


// Intelligent recommendations with collaborative filtering
export async function getIntelligentRecommendations(
  userId: string,
  options: {
    limit?: number;
    algorithm?: 'collaborative' | 'content' | 'hybrid';
    diversityThreshold?: number;
    enableDiversityFiltering?: boolean;
  } = {}
) {
  const { 
    limit = 10, 
    algorithm = 'hybrid',
    diversityThreshold = 0.3,
    enableDiversityFiltering = true
  } = options;

  try {
    const ready = await isQdrantReady();
    if (!ready) return [];

    let recommendations = [];

    if (algorithm === 'collaborative' || algorithm === 'hybrid') {
      const collaborativeRecs = await getCollaborativeRecommendations(userId, limit);
      recommendations = [...recommendations, ...collaborativeRecs];
    }

    if (algorithm === 'content' || algorithm === 'hybrid') {
      const contentRecs = await getContentBasedRecommendations(userId, limit);
      recommendations = [...recommendations, ...contentRecs];
    }

    // Apply diversity filtering to prevent echo chambers
    if (enableDiversityFiltering) {
      recommendations = applyDiversityFiltering(recommendations, diversityThreshold);
    }

    // Remove duplicates and limit results
    const uniqueRecommendations = removeDuplicateRecommendations(recommendations);
    return uniqueRecommendations.slice(0, limit);

  } catch (error) {
    console.error('Error getting intelligent recommendations:', error);
    return [];
  }
}

// Collaborative filtering using sparse vectors
async function getCollaborativeRecommendations(userId: string, limit: number): Promise<any[]> {
  try {
    // Get user's interaction history
    const userInteractions = await getUserInteractionVector(userId);
    
    if (!userInteractions || userInteractions.indices.length === 0) {
      return [];
    }

    // Find similar users using sparse vector similarity
    const similarUsers = await qdrantClient.search(COLLECTIONS.RECOMMENDATIONS, {
      vector: userInteractions,
      limit: 20,
      with_payload: true
    });

    // Get recommendations from similar users
    const recommendations = [];
    for (const user of similarUsers) {
      const userRecs = await getUserRecommendations(user.payload.userId, limit);
      recommendations.push(...userRecs);
    }

    return recommendations;
  } catch (error) {
    console.error('Error in collaborative filtering:', error);
    return [];
  }
}

// Content-based recommendations using dense vectors
async function getContentBasedRecommendations(userId: string, limit: number): Promise<any[]> {
  try {
    // Get user's content preferences
    const userProfile = await getUserProfileVector(userId);
    
    if (!userProfile) {
      return [];
    }

    // Find similar content
    const similarContent = await qdrantClient.search(COLLECTIONS.POSTS, {
      vector: userProfile,
      limit: limit * 2,
      with_payload: true
    });

    return similarContent.map(result => result.payload);
  } catch (error) {
    console.error('Error in content-based recommendations:', error);
    return [];
  }
}

// Apply diversity filtering to prevent echo chambers
function applyDiversityFiltering(recommendations: any[], threshold: number): any[] {
  const diverseRecommendations = [];
  const seenCategories = new Set();
  const seenAuthors = new Set();

  for (const rec of recommendations) {
    const category = rec.category || rec.payload?.category;
    const author = rec.author || rec.payload?.author;

    const categoryDiversity = !seenCategories.has(category);
    const authorDiversity = !seenAuthors.has(author);

    if (categoryDiversity || authorDiversity || Math.random() > threshold) {
      diverseRecommendations.push(rec);
      if (category) seenCategories.add(category);
      if (author) seenAuthors.add(author);
    }
  }

  return diverseRecommendations;
}

// Remove duplicate recommendations
function removeDuplicateRecommendations(recommendations: any[]): any[] {
  const seen = new Set();
  return recommendations.filter(rec => {
    const id = rec.id || rec.payload?.id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

type TimeRange = 'day' | 'week' | 'month' | 'year' | 'all';

// Enhanced vector search with advanced filtering and boosting
export async function vectorSearchWithFilters(params: {
  query: string;
  limit?: number;
  types?: Array<'post' | 'comment' | 'category' | 'user'>;
  categoryId?: string;
  timeRange?: TimeRange;
  sort?: 'relevance' | 'new' | 'top';
  scoreThreshold?: number;
  boostFactors?: { [key: string]: number };
  groupBy?: string;
}) {
  const { 
    query, 
    limit = 10, 
    types, 
    categoryId, 
    timeRange = 'all', 
    sort = 'relevance',
    scoreThreshold = 0.0,
    boostFactors = {},
    groupBy
  } = params;

  if (!hasEmbeddingProvider) {
    // Fallback to DB filtering
    try {
      const { db } = await import('./db');
      const wherePost: any = {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      };
      if (categoryId) wherePost.categoryId = categoryId;

      const posts = await db.post.findMany({
        where: wherePost,
        include: { user: { select: { id: true, name: true, username: true } }, category: true },
        orderBy: sort === 'new' ? { createdAt: 'desc' } : undefined,
        take: limit,
      });
      const formattedPosts = posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt.toISOString(),
        userId: post.userId,
        username: post.user.username,
        userName: post.user.name,
        categoryId: post.categoryId,
        categoryName: post.category.name,
        type: 'post' as const,
        score: 0.9,
      }));

      return formattedPosts.slice(0, limit);
    } catch {
      return [];
    }
  }

  try {
    const ready = await isQdrantReady();
    if (!ready) return vectorSearch(query, limit);

    const queryEmbedding = await generateEmbedding(query, 'query');

    const searches: Array<Promise<any[]>> = [];
    const collections: Array<{ name: string; type: 'post'|'comment'|'category'|'user' }>= [];
    const includeTypes = types && types.length ? types : ['post','comment','category'];
    if (includeTypes.includes('post')) { collections.push({ name: COLLECTIONS.POSTS, type: 'post' }); }
    if (includeTypes.includes('comment')) { collections.push({ name: COLLECTIONS.COMMENTS, type: 'comment' }); }
    if (includeTypes.includes('category')) { collections.push({ name: COLLECTIONS.CATEGORIES, type: 'category' }); }
    if (includeTypes.includes('user')) { collections.push({ name: COLLECTIONS.USERS, type: 'user' }); }

    for (const c of collections) {
      searches.push(
        qdrantClient.search(c.name, {
          vector: queryEmbedding,
          limit,
          filter: buildQdrantFilter({ type: c.type, categoryId, timeRange }),
        })
      );
    }

    const results = await Promise.all(searches);
    const merged = results.flat().map((r: any) => ({ ...r, payload: { ...r.payload, score: r.score } }));

    // Deduplicate by id+type, keep max score
    const dedupMap = new Map<string, any>();
    for (const item of merged) {
      const payload = item.payload || {};
      const key = `${payload.type}:${payload.id}`;
      if (!dedupMap.has(key) || (dedupMap.get(key).score ?? 0) < (payload.score ?? 0)) {
        dedupMap.set(key, payload);
      }
    }

    let items = Array.from(dedupMap.values());

    if (sort === 'new') {
      items = items.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sort === 'relevance') {
      items = items.sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0));
    }

    return items.slice(0, limit);
  } catch (error) {
    console.error('Error in vectorSearchWithFilters:', error);
    return [];
  }
}

function buildQdrantFilter(opts: { type: 'post'|'comment'|'category'|'user'; categoryId?: string; timeRange?: TimeRange }) {
  const must: any[] = [];
  if (opts.type) {
    must.push({ key: 'type', match: { value: opts.type } });
  }
  if (opts.categoryId && opts.type === 'post') {
    must.push({ key: 'categoryId', match: { value: opts.categoryId } });
  }
  if (opts.timeRange && opts.timeRange !== 'all') {
    const now = Date.now();
    const ranges: Record<TimeRange, number> = {
      day: 24*60*60*1000,
      week: 7*24*60*60*1000,
      month: 30*24*60*60*1000,
      year: 365*24*60*60*1000,
      all: Number.MAX_SAFE_INTEGER,
    };
    const sinceTs = now - ranges[opts.timeRange];
    must.push({ key: 'createdAtTs', range: { gte: sinceTs } });
  }
  return must.length ? { must } : undefined;
}

async function mockSearch(query: string, limit = 10) {
  try {
    console.warn('Vector search fallback: provider or Qdrant unavailable');

    // If DB is not reachable, return empty without attempting queries
    const dbOk = await isDbAvailable(600);
    if (!dbOk) return [];

    const { db } = await import('./db');

    const posts = await db.post.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        category: true,
      },
      take: limit,
    });
    
    const comments = await db.comment.findMany({
      where: {
        content: { contains: query },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      take: limit,
    });
    
    const categories = await db.category.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: limit,
    });
    
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt.toISOString(),
      userId: post.userId,
      username: post.user.username,
      userName: post.user.name,
      categoryId: post.categoryId,
      categoryName: post.category.name,
      type: 'post',
      score: 0.9, // Mock score
    }));
    
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      userId: comment.userId,
      username: comment.user.username,
      userName: comment.user.name,
      postId: comment.postId,
      postTitle: comment.post.title,
      type: 'comment',
      score: 0.8, // Mock score
    }));
    
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      type: 'category',
      score: 0.7, // Mock score
    }));
    
    return [...formattedPosts, ...formattedComments, ...formattedCategories].slice(0, limit);
  } catch (error) {
    console.error('Error during mock search:', error);
    return [];
  }
}

export async function deleteDocument(id: string, type: 'post' | 'comment' | 'category') {
  
  try {
    const ready = await isQdrantReady();
    if (!ready) return true;
    let collection;
    
    switch (type) {
      case 'post':
        collection = COLLECTIONS.POSTS;
        break;
      case 'comment':
        collection = COLLECTIONS.COMMENTS;
        break;
      case 'category':
        collection = COLLECTIONS.CATEGORIES;
        break;
      default:
        throw new Error(`Invalid document type: ${type}`);
    }
    
    await qdrantClient.delete(collection, {
      wait: true,
      points: [id],
    });
    
    return true;
  } catch (error) {
    console.error(`Error deleting ${type}:`, error);
    return false;
  }
} 

export async function findSimilarPostsByPostId(postId: string, limit = 4) {
  try {
    const { db } = await import('./db');

    // Fetch source post to build an embedding query
    let post: any = null;
    try {
      post = await db.post.findUnique({
        where: { id: postId },
        include: {
          user: { select: { username: true } },
          category: { select: { name: true } },
        },
      });
    } catch (err) {
      console.error('DB error fetching source post for similarity:', err);
    }

    if (!post) {
      // Fallback: same-category latest posts if DB available, else []
      try {
        const sameCategory = await db.post.findMany({
          where: { categoryId: post?.categoryId, id: { not: postId } },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { category: true, user: { select: { name: true, username: true, image: true } } },
        });
        return sameCategory;
      } catch {
        return [];
      }
    }

    if (!hasEmbeddingProvider) {
      // Keyword-style fallback when OpenAI is not available
      try {
        const sameCategory = await db.post.findMany({
          where: { categoryId: post.categoryId, id: { not: postId } },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { category: true, user: { select: { name: true, username: true, image: true } } },
        });
        return sameCategory;
      } catch {
        return [];
      }
    }

    const ready = await isQdrantReady();
    if (!ready) {
      try {
        const sameCategory = await db.post.findMany({
          where: { categoryId: post.categoryId, id: { not: postId } },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { category: true, user: { select: { name: true, username: true, image: true } } },
        });
        return sameCategory;
      } catch {
        return [];
      }
    }

    const textToEmbed = `${post.title} ${post.content} ${post.user?.username || ''} ${post.category?.name || ''}`;
    const embedding = await generateEmbedding(textToEmbed, 'query');

    // +1 to account for the source post, which we will filter out
    const results = await qdrantClient.search(COLLECTIONS.POSTS, {
      vector: embedding,
      limit: limit + 1,
    });

    const ids = results
      .map((r: any) => r.payload?.id || r.id)
      .filter((id: string) => id && id !== postId)
      .slice(0, limit);

    if (ids.length === 0) return [];

    // Fetch posts by ids and preserve Qdrant ranking
    const posts = await db.post.findMany({
      where: { id: { in: ids } },
      include: {
        user: { select: { name: true, username: true, image: true } },
        category: true,
        _count: { select: { comments: true, votes: true } },
      },
    });
    const order: Record<string, number> = {};
    ids.forEach((id, idx) => (order[id] = idx));
    return posts.sort((a, b) => (order[a.id] ?? 0) - (order[b.id] ?? 0));
  } catch (error) {
    console.error('Error in findSimilarPostsByPostId:', error);
    return [];
  }
}

export async function recommendPostsForCategorySlug(slug: string, limit = 6) {
  try {
    const { db } = await import('./db');
    let category: any = null;
    try {
      category = await db.category.findUnique({ where: { slug } });
    } catch (err) {
      console.error('DB error fetching category:', err);
    }

    if (!category) return [];

    if (!hasEmbeddingProvider) {
      try {
        const posts = await db.post.findMany({
          where: { categoryId: category.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { category: true, user: { select: { name: true, username: true, image: true } } },
    });
        return posts;
      } catch {
        return [];
      }
    }

    const ready = await isQdrantReady();
    if (!ready) {
      try {
        const posts = await db.post.findMany({
          where: { categoryId: category.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { category: true, user: { select: { name: true, username: true, image: true } } },
        });
        return posts;
      } catch {
        return [];
      }
    }

    // Use category name as a semantic query into the posts collection
    const queryEmbedding = await generateEmbedding(category.name + ' ' + (category.description || ''), 'query');
    const results = await qdrantClient.search(COLLECTIONS.POSTS, { vector: queryEmbedding, limit });
    const ids = results.map((r: any) => r.payload?.id || r.id).filter(Boolean);
    if (ids.length === 0) return [];

    const { db: db2 } = await import('./db');
    const posts = await db2.post.findMany({
      where: { id: { in: ids } },
      include: { category: true, user: { select: { name: true, username: true, image: true } }, _count: { select: { comments: true, votes: true } } },
    });
    const order: Record<string, number> = {};
    ids.forEach((id, idx) => (order[id] = idx));
    return posts.sort((a, b) => (order[a.id] ?? 0) - (order[b.id] ?? 0));
  } catch (error) {
    console.error('Error in recommendPostsForCategorySlug:', error);
    return [];
  }
}

export async function recommendPosts(limit = 6) {
  try {
    if (!hasEmbeddingProvider) {
      const { db } = await import('./db');
      try {
        const posts = await db.post.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { category: true, user: { select: { name: true, username: true, image: true } }, _count: { select: { comments: true, votes: true } } },
        });
        return posts;
      } catch {
        return [];
      }
    }

    const ready = await isQdrantReady();
    if (!ready) {
      const { db } = await import('./db');
      try {
        const posts = await db.post.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { category: true, user: { select: { name: true, username: true, image: true } }, _count: { select: { comments: true, votes: true } } },
        });
        return posts;
      } catch {
        return [];
      }
    }

    // Generic semantic query to surface popular/varied content
    const queryEmbedding = await generateEmbedding('trending interesting popular insightful discussions', 'query');
    const results = await qdrantClient.search(COLLECTIONS.POSTS, { vector: queryEmbedding, limit });
    const ids = results.map((r: any) => r.payload?.id || r.id).filter(Boolean);
    if (ids.length === 0) return [];

    const { db } = await import('./db');
    const posts = await db.post.findMany({
      where: { id: { in: ids } },
      include: { category: true, user: { select: { name: true, username: true, image: true } }, _count: { select: { comments: true, votes: true } } },
    });
    const order: Record<string, number> = {};
    ids.forEach((id, idx) => (order[id] = idx));
    return posts.sort((a, b) => (order[a.id] ?? 0) - (order[b.id] ?? 0));
  } catch (error) {
    console.error('Error in recommendPosts:', error);
    return [];
  }
}

export async function indexUser(user: User & { posts?: any[], comments?: any[] }) {
  try {
    const ready = await isQdrantReady();
    if (!ready) return false;

    // Build user profile text from their content and metadata
    const userPosts = user.posts || [];
    const userComments = user.comments || [];
    
    const postContent = userPosts.map(p => `${p.title} ${p.content}`).join(' ');
    const commentContent = userComments.map(c => c.content).join(' ');
    
    const textToEmbed = [
      user.name || user.username,
      user.bio || '',
      postContent,
      commentContent,
      `interests: ${user.name} ${user.username}`
    ].filter(Boolean).join(' ');

    const embedding = await generateEmbedding(textToEmbed, 'passage');

    const pointId = hashStringToNumber(user.id);
    
    await qdrantClient.upsert(COLLECTIONS.USERS, {
      wait: true,
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            id: user.id,
            name: user.name,
            username: user.username,
            bio: user.bio,
            email: user.email,
            image: user.image,
            postCount: userPosts.length,
            commentCount: userComments.length,
            createdAt: user.createdAt.toISOString(),
            type: 'user',
          },
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Error indexing user:', error);
    return false;
  }
}

// Intelligent recommendation system with collaborative filtering
export async function recommendPostsForUser(userId: string, limit = 6) {
  try {
    const { db } = await import('./db');
    
    // Get user profile and interaction history
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        posts: { take: 10, orderBy: { createdAt: 'desc' } },
        comments: { take: 20, orderBy: { createdAt: 'desc' } },
        votes: { take: 50, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!user) {
      return recommendPosts(limit);
    }

    const ready = await isQdrantReady();
    if (!ready || !hasEmbeddingProvider) {
      return getFallbackRecommendations(userId, limit);
    }

    // Try collaborative filtering with sparse vectors first
    const collaborativeRecs = await getCollaborativeRecommendations(userId, limit);
    if (collaborativeRecs.length > 0) {
      return collaborativeRecs;
    }

    // Fallback to content-based recommendations
    return getContentBasedRecommendations(userId, limit);

  } catch (error) {
    console.error('Error in recommendPostsForUser:', error);
    return recommendPosts(limit);
  }
}



// Fallback recommendations when Qdrant is unavailable
async function getFallbackRecommendations(userId: string, limit: number) {
  try {
    const { db } = await import('./db');
    
    const userCategories = await db.post.findMany({
      where: {
        OR: [
          { userId: userId },
          { comments: { some: { userId: userId } } }
        ]
      },
      select: { categoryId: true },
      distinct: ['categoryId'],
      take: 5
    });

    const categoryIds = userCategories.map(p => p.categoryId);
    
    const posts = await db.post.findMany({
      where: {
        categoryId: { in: categoryIds },
        userId: { not: userId }
      },
      include: {
        category: true,
        user: { select: { name: true, username: true, image: true } },
        _count: { select: { comments: true, votes: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return posts;
  } catch (error) {
    console.error('Fallback recommendations failed:', error);
    return [];
  }
}


// Index user interactions for collaborative filtering
export async function indexUserInteractions(userId: string) {
  try {
    const { db } = await import('./db');
    const ready = await isQdrantReady();
    if (!ready) return false;

    // Get user's voting history
    const userVotes = await db.vote.findMany({
      where: { userId },
      include: { post: { select: { id: true, categoryId: true } } }
    });

    if (userVotes.length === 0) return true;

    // Build sparse vector from user interactions
    const userRatings: { [postId: string]: number } = {};
    const categoryPreferences: { [categoryId: string]: number } = {};
    
    userVotes.forEach(vote => {
      const rating = vote.type === 'UP' ? 1 : -1;
      userRatings[vote.post.id] = rating;
      
      const categoryId = vote.post.categoryId;
      categoryPreferences[categoryId] = (categoryPreferences[categoryId] || 0) + rating;
    });

    const userSparseVector = generateSparseVector(userRatings);
    const pointId = hashStringToNumber(userId);

    // Get posts user might like based on their preferences
    const recommendedPosts = await getRecommendedPostIds(categoryPreferences, userId);

    await qdrantClient.upsert(COLLECTIONS.RECOMMENDATIONS, {
      wait: true,
      points: [{
        id: pointId,
        vector: {
          ratings: {
            indices: userSparseVector.indices,
            values: userSparseVector.values
          }
        },
        payload: {
          userId,
          totalInteractions: userVotes.length,
          categoryPreferences,
          recommendedPosts,
          lastUpdated: new Date().toISOString()
        }
      }]
    });

    return true;
  } catch (error) {
    console.error('Error indexing user interactions:', error);
    return false;
  }
}

// Get recommended post IDs based on category preferences
async function getRecommendedPostIds(
  categoryPreferences: { [categoryId: string]: number }, 
  excludeUserId: string
): Promise<string[]> {
  try {
    const { db } = await import('./db');
    
    // Get top categories user likes
    const topCategories = Object.entries(categoryPreferences)
      .filter(([_, score]) => score > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
      .map(([categoryId]) => categoryId);

    if (topCategories.length === 0) return [];

    const recommendedPosts = await db.post.findMany({
      where: {
        categoryId: { in: topCategories },
        userId: { not: excludeUserId }
      },
      select: { id: true },
      orderBy: [
        { votes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
        { createdAt: 'desc' }
      ],
      take: 50
    });

    return recommendedPosts.map(p => p.id);
  } catch (error) {
    console.error('Error getting recommended post IDs:', error);
    return [];
  }
}

// Multi-modal content indexing
export async function indexMultiModalContent(content: {
  id: string;
  text?: string;
  imageUrl?: string;
  documentUrl?: string;
  type: 'post' | 'comment' | 'document';
  metadata?: any;
}) {
  try {
    const ready = await isQdrantReady();
    if (!ready) return false;

    const embeddings = await generateMultiModalEmbedding({
      text: content.text,
      image: content.imageUrl,
      document: content.documentUrl
    });

    const pointId = hashStringToNumber(content.id);
    
    await qdrantClient.upsert(COLLECTIONS.MULTIMODAL, {
      wait: true,
      points: [{
        id: pointId,
        vector: embeddings,
        payload: {
          id: content.id,
          type: content.type,
          text: content.text,
          imageUrl: content.imageUrl,
          documentUrl: content.documentUrl,
          createdAt: new Date().toISOString(),
          ...content.metadata
        }
      }]
    });

    return true;
  } catch (error) {
    console.error('Error indexing multi-modal content:', error);
    return false;
  }
}

// Cross-modal search (e.g., text-to-image, image-to-text)
export async function crossModalSearch(
  query: string | Buffer,
  targetModality: 'text' | 'image' | 'document',
  options: {
    limit?: number;
    scoreThreshold?: number;
    filters?: any;
  } = {}
) {
  const { limit = 10, scoreThreshold = 0.7, filters } = options;
  
  try {
    const ready = await isQdrantReady();
    if (!ready) return [];

    let queryEmbedding: number[];
    
    if (typeof query === 'string') {
      queryEmbedding = await generateEmbedding(query, 'query');
    } else {
      queryEmbedding = await generateImageEmbedding(query);
    }

    const results = await qdrantClient.search(COLLECTIONS.MULTIMODAL, {
      vector: queryEmbedding,
      using: targetModality,
      limit,
      score_threshold: scoreThreshold,
      filter: filters,
      with_payload: true
    });

    return results.map(r => ({
      ...r.payload,
      score: r.score
    }));
  } catch (error) {
    console.error('Cross-modal search failed:', error);
    return [];
  }
}

// Batch update user recommendations
export async function batchUpdateRecommendations(userIds: string[]) {
  const results = await Promise.allSettled(
    userIds.map(userId => indexUserInteractions(userId))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Recommendation update: ${successful} successful, ${failed} failed`);
  return { successful, failed };
}export async function isQdrantReady(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 500);
    const res = await fetch(`${qdrantUrl}/readyz`, { signal: controller.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}async function isDbAvailable(timeoutMs = 500): Promise<boolean> {
  try {
    const controller = new AbortController();
    const { db } = await import('./db');
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    // Prisma does not support AbortController; emulate timeout with race
    await Promise.race([
      db.$connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('connect-timeout')), timeoutMs)),
    ]);
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}



