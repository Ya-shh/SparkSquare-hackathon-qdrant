// Mistral LLM Configuration
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'open-mixtral-8x22b';
const MISTRAL_ENDPOINT = process.env.MISTRAL_ENDPOINT || 'https://api.mistral.ai/v1';
const USE_MISTRAL_LLM = process.env.USE_MISTRAL_LLM === 'true';
const MISTRAL_MAX_TOKENS = parseInt(process.env.MISTRAL_MAX_TOKENS || '4096');
const MISTRAL_TEMPERATURE = parseFloat(process.env.MISTRAL_TEMPERATURE || '0.7');

// Initialize Mistral client
let mistralClient = null;
if (MISTRAL_API_KEY) {
  try {
    const { Mistral } = require('@mistralai/mistralai');
    mistralClient = new Mistral({
      apiKey: MISTRAL_API_KEY,
      serverURL: MISTRAL_ENDPOINT
    });
  } catch (error) {
    console.error('Failed to initialize Mistral client in mistral-llm.ts:', error);
    mistralClient = null;
  }
}

export interface MistralLLMOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  randomSeed?: number;
}

export interface MistralResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

// Enhanced content analysis using Mixtral-8x22B
export async function analyzeContentWithMistral(
  content: string,
  analysisType: 'summarize' | 'categorize' | 'extract_keywords' | 'sentiment' | 'generate_tags' | 'quality_score',
  options: MistralLLMOptions = {}
): Promise<MistralResponse> {
  if (!mistralClient || !USE_MISTRAL_LLM) {
    throw new Error('Mistral LLM is not configured or enabled');
  }

  const {
    maxTokens = MISTRAL_MAX_TOKENS,
    temperature = MISTRAL_TEMPERATURE,
    topP = 0.9,
    stream = false,
    randomSeed
  } = options;

  try {
    const prompt = generateAnalysisPrompt(content, analysisType);
    
    const response = await mistralClient.chat.complete({
      model: MISTRAL_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens,
      temperature,
      topP,
      stream,
      ...(randomSeed && { randomSeed })
    });

    const choice = response.choices?.[0];
    if (!choice) {
      throw new Error('No response from Mistral');
    }

    return {
      content: choice.message?.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.promptTokens || 0,
        completionTokens: response.usage.completionTokens || 0,
        totalTokens: response.usage.totalTokens || 0
      } : undefined,
      model: response.model || MISTRAL_MODEL,
      finishReason: choice.finishReason
    };
  } catch (error) {
    console.error('Mistral LLM analysis error:', error);
    throw error;
  }
}

// Generate intelligent search queries using Mixtral-8x22B
export async function generateSearchQueries(
  userQuery: string,
  context: {
    previousQueries?: string[];
    userInterests?: string[];
    searchMode?: 'broad' | 'specific' | 'creative';
  } = {},
  options: MistralLLMOptions = {}
): Promise<{
  originalQuery: string;
  enhancedQueries: string[];
  semanticExpansions: string[];
  crossModalQueries: string[];
  reasoning: string;
}> {
  if (!mistralClient || !USE_MISTRAL_LLM) {
    return {
      originalQuery: userQuery,
      enhancedQueries: [userQuery],
      semanticExpansions: [userQuery],
      crossModalQueries: [userQuery],
      reasoning: 'Mistral LLM not available, using original query'
    };
  }

  const { searchMode = 'broad', previousQueries = [], userInterests = [] } = context;

  try {
    const prompt = `You are an AI search query expert using advanced multimodal understanding. Generate enhanced search queries for better vector search results.

Original Query: "${userQuery}"
Search Mode: ${searchMode}
User Interests: ${userInterests.join(', ') || 'None specified'}
Previous Queries: ${previousQueries.slice(-3).join(', ') || 'None'}

Generate a JSON response with:
1. enhancedQueries: 3-5 improved versions of the original query with better semantic richness
2. semanticExpansions: 3-5 queries that expand the semantic meaning and related concepts
3. crossModalQueries: 3-5 queries optimized for finding images, documents, and multimedia content related to the topic
4. reasoning: Brief explanation of your enhancement strategy

Focus on:
- Adding semantic context and related concepts
- Including technical and domain-specific terminology
- Optimizing for vector similarity search
- Considering multimodal content (images, documents, videos)
- Avoiding overly broad or generic terms

Return only valid JSON.`;

    const response = await mistralClient.chat.complete({
      model: MISTRAL_MODEL,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      topP: options.topP || 0.9
    });

    const content = response.choices?.[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(content);
      return {
        originalQuery: userQuery,
        enhancedQueries: parsed.enhancedQueries || [userQuery],
        semanticExpansions: parsed.semanticExpansions || [userQuery],
        crossModalQueries: parsed.crossModalQueries || [userQuery],
        reasoning: parsed.reasoning || 'Query enhancement applied'
      };
    } catch (parseError) {
      console.error('Failed to parse Mistral response:', parseError);
      return {
        originalQuery: userQuery,
        enhancedQueries: [userQuery],
        semanticExpansions: [userQuery],
        crossModalQueries: [userQuery],
        reasoning: 'Query parsing failed, using original'
      };
    }
  } catch (error) {
    console.error('Error generating search queries with Mistral:', error);
    return {
      originalQuery: userQuery,
      enhancedQueries: [userQuery],
      semanticExpansions: [userQuery],
      crossModalQueries: [userQuery],
      reasoning: 'Error occurred, using original query'
    };
  }
}

// Generate intelligent content recommendations using Mixtral-8x22B
export async function generateContentRecommendations(
  userProfile: {
    interests: string[];
    previousContent: string[];
    activityLevel: 'low' | 'medium' | 'high';
    preferredCategories: string[];
  },
  availableContent: {
    id: string;
    title: string;
    content: string;
    category: string;
    tags?: string[];
  }[],
  options: {
    limit?: number;
    diversityFactor?: number;
    noveltyFactor?: number;
  } = {}
): Promise<{
  recommendations: {
    contentId: string;
    score: number;
    reasoning: string;
    category: 'similar' | 'diverse' | 'novel' | 'trending';
  }[];
  strategy: string;
  personalizedInsights: string;
}> {
  if (!mistralClient || !USE_MISTRAL_LLM) {
    return {
      recommendations: availableContent.slice(0, options.limit || 5).map(content => ({
        contentId: content.id,
        score: 0.5,
        reasoning: 'Mistral LLM not available',
        category: 'similar' as const
      })),
      strategy: 'Fallback recommendation',
      personalizedInsights: 'Advanced recommendations require Mistral LLM'
    };
  }

  try {
    const prompt = `You are an expert recommendation system using advanced understanding of user preferences and content analysis.

User Profile:
- Interests: ${userProfile.interests.join(', ')}
- Activity Level: ${userProfile.activityLevel}
- Preferred Categories: ${userProfile.preferredCategories.join(', ')}
- Recent Content Engagement: ${userProfile.previousContent.slice(-5).join(', ')}

Available Content (${availableContent.length} items):
${availableContent.map(content => 
  `ID: ${content.id} | Title: ${content.title} | Category: ${content.category} | Preview: ${content.content.substring(0, 100)}...`
).join('\n')}

Generate intelligent recommendations considering:
1. User's explicit interests and preferences
2. Content quality and relevance
3. Diversity to avoid echo chambers
4. Novelty for discovery
5. Serendipitous connections

Return JSON with:
- recommendations: Array of {contentId, score (0-1), reasoning, category}
- strategy: Overall recommendation approach used
- personalizedInsights: 2-3 insights about the user's content preferences

Limit to ${options.limit || 5} recommendations. Prioritize quality over quantity.`;

    const response = await mistralClient.chat.complete({
      model: MISTRAL_MODEL,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent recommendations
      topP: 0.9
    });

    const content = response.choices?.[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(content);
      return {
        recommendations: parsed.recommendations || [],
        strategy: parsed.strategy || 'AI-powered personalized recommendations',
        personalizedInsights: parsed.personalizedInsights || 'Recommendations tailored to your interests'
      };
    } catch (parseError) {
      console.error('Failed to parse Mistral recommendations:', parseError);
      return {
        recommendations: availableContent.slice(0, options.limit || 5).map(content => ({
          contentId: content.id,
          score: 0.5,
          reasoning: 'Parsing failed',
          category: 'similar' as const
        })),
        strategy: 'Fallback after parsing error',
        personalizedInsights: 'Recommendation parsing encountered an issue'
      };
    }
  } catch (error) {
    console.error('Error generating content recommendations:', error);
    return {
      recommendations: [],
      strategy: 'Error in recommendation generation',
      personalizedInsights: 'Unable to generate personalized insights'
    };
  }
}

// Enhanced image analysis using Mixtral-8x22B for alt text and descriptions
export async function generateImageDescription(
  imageContext: {
    filename?: string;
    fileType?: string;
    extractedText?: string;
    detectedObjects?: string[];
    colors?: string[];
    context?: string;
  },
  options: {
    style?: 'descriptive' | 'concise' | 'technical' | 'creative';
    includeAltText?: boolean;
    includeTags?: boolean;
  } = {}
): Promise<{
  description: string;
  altText?: string;
  tags?: string[];
  confidence: number;
}> {
  if (!mistralClient || !USE_MISTRAL_LLM) {
    return {
      description: `Image: ${imageContext.filename || 'uploaded image'}`,
      altText: options.includeAltText ? 'Image uploaded by user' : undefined,
      tags: options.includeTags ? ['image', 'visual', 'content'] : undefined,
      confidence: 0.3
    };
  }

  const { style = 'descriptive', includeAltText = true, includeTags = true } = options;

  try {
    const prompt = `Generate an intelligent description for an image based on available context.

Image Context:
- Filename: ${imageContext.filename || 'Not available'}
- File Type: ${imageContext.fileType || 'Not available'}
- Extracted Text (OCR): ${imageContext.extractedText || 'None'}
- Detected Objects: ${imageContext.detectedObjects?.join(', ') || 'None'}
- Dominant Colors: ${imageContext.colors?.join(', ') || 'None'}
- Additional Context: ${imageContext.context || 'None'}

Style: ${style}

Generate a JSON response with:
- description: ${style} description of the image (2-3 sentences)
- altText: Accessible alt text for screen readers (if requested: ${includeAltText})
- tags: 5-8 relevant tags for searchability (if requested: ${includeTags})
- confidence: Confidence score (0-1) based on available context

Focus on being helpful, accurate, and informative while working with limited context.`;

    const response = await mistralClient.chat.complete({
      model: MISTRAL_MODEL,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 500,
      temperature: 0.5,
      topP: 0.9
    });

    const content = response.choices?.[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(content);
      return {
        description: parsed.description || 'Image description not available',
        altText: includeAltText ? parsed.altText : undefined,
        tags: includeTags ? parsed.tags : undefined,
        confidence: parsed.confidence || 0.5
      };
    } catch (parseError) {
      console.error('Failed to parse Mistral image description:', parseError);
      return {
        description: `${style} image: ${imageContext.filename || 'visual content'}`,
        altText: includeAltText ? 'Image with visual content' : undefined,
        tags: includeTags ? ['image', 'visual', 'content'] : undefined,
        confidence: 0.4
      };
    }
  } catch (error) {
    console.error('Error generating image description:', error);
    return {
      description: 'Image description generation failed',
      altText: includeAltText ? 'Image content' : undefined,
      tags: includeTags ? ['image'] : undefined,
      confidence: 0.2
    };
  }
}

// Helper function to generate analysis prompts
function generateAnalysisPrompt(content: string, analysisType: string): string {
  const prompts = {
    summarize: `Provide a concise, informative summary of the following content in 2-3 sentences:\n\n${content}`,
    
    categorize: `Analyze the following content and suggest the most appropriate categories from: Technology, Science, Programming, Design, Business, Health, Education, Entertainment, News, Sports, Travel, Food, Lifestyle, or Other. Provide 1-3 categories with brief reasoning:\n\n${content}`,
    
    extract_keywords: `Extract 8-12 important keywords and phrases from the following content. Focus on meaningful terms that would be useful for search and categorization:\n\n${content}`,
    
    sentiment: `Analyze the sentiment of the following content. Provide: sentiment (positive/negative/neutral), confidence (0-1), and key indicators:\n\n${content}`,
    
    generate_tags: `Generate 10-15 relevant tags for the following content. Include both specific and general tags that would help with discovery and organization:\n\n${content}`,
    
    quality_score: `Evaluate the quality of the following content on a scale of 1-10 considering: clarity, informativeness, originality, accuracy, and engagement. Provide score and brief reasoning:\n\n${content}`
  };

  return prompts[analysisType as keyof typeof prompts] || `Analyze the following content:\n\n${content}`;
}

// Stream responses for real-time applications
export async function streamMistralResponse(
  prompt: string,
  options: MistralLLMOptions = {}
): Promise<AsyncGenerator<string, void, unknown>> {
  if (!mistralClient || !USE_MISTRAL_LLM) {
    throw new Error('Mistral LLM is not configured or enabled');
  }

  const response = await mistralClient.chat.stream({
    model: MISTRAL_MODEL,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: options.maxTokens || MISTRAL_MAX_TOKENS,
    temperature: options.temperature || MISTRAL_TEMPERATURE,
    topP: options.topP || 0.9
  });

  return (async function* () {
    for await (const chunk of response) {
      const content = chunk.data.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  })();
}

// Export configuration and utilities
export const mistralConfig = {
  isAvailable: !!mistralClient && USE_MISTRAL_LLM,
  model: MISTRAL_MODEL,
  endpoint: MISTRAL_ENDPOINT,
  maxTokens: MISTRAL_MAX_TOKENS,
  temperature: MISTRAL_TEMPERATURE
};

export { mistralClient };
