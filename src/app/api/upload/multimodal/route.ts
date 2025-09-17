import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { indexMultiModalContent } from '@/lib/multimodal-embeddings';
import sharp from 'sharp';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
const ALLOWED_IMAGE_TYPES = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');
const ALLOWED_DOCUMENT_TYPES = (process.env.ALLOWED_DOCUMENT_TYPES || 'application/pdf,text/plain').split(',');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const text = formData.get('text') as string || '';
    const title = formData.get('title') as string || '';
    const categoryId = formData.get('categoryId') as string;
    const extractText = formData.get('extractText') === 'true';
    const generateAltText = formData.get('generateAltText') === 'true';

    if (!file && !text) {
      return NextResponse.json(
        { error: 'Either file or text content is required' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    let processedContent: {
      text?: string;
      imageBuffer?: Buffer;
      documentBuffer?: Buffer;
      metadata: any;
    } = { metadata: {} };

    // Process uploaded file
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileType = file.type;

      if (ALLOWED_IMAGE_TYPES.includes(fileType)) {
        // Process image
        const processedImage = await processImage(fileBuffer, {
          maxWidth: parseInt(process.env.MAX_IMAGE_DIMENSION || '1920'),
          quality: parseInt(process.env.IMAGE_QUALITY || '80'),
          generateAltText
        });

        processedContent.imageBuffer = processedImage.buffer;
        processedContent.metadata = {
          ...processedContent.metadata,
          ...processedImage.metadata,
          originalFileType: fileType,
          originalFileName: file.name,
          fileType: 'image'
        };

        if (processedImage.altText) {
          processedContent.text = `${text} ${processedImage.altText}`.trim();
        }

      } else if (ALLOWED_DOCUMENT_TYPES.includes(fileType) || fileType.includes('document')) {
        // Process document
        const processedDoc = await processDocument(fileBuffer, {
          extractText,
          fileType,
          fileName: file.name
        });

        processedContent.documentBuffer = fileBuffer;
        processedContent.metadata = {
          ...processedContent.metadata,
          ...processedDoc.metadata,
          originalFileType: fileType,
          originalFileName: file.name,
          fileType: 'document'
        };

        if (processedDoc.extractedText) {
          processedContent.text = `${text} ${processedDoc.extractedText}`.trim();
        }

      } else {
        return NextResponse.json(
          { error: `Unsupported file type: ${fileType}` },
          { status: 400 }
        );
      }
    } else {
      // Text-only content
      processedContent.text = text;
      processedContent.metadata.fileType = 'text';
    }

    // Create post in database
    const { db } = await import('@/lib/db');
    
    const post = await db.post.create({
      data: {
        title: title || 'Untitled',
        content: processedContent.text || '',
        userId: session.user.id,
        categoryId,
        viewCount: 0
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
        category: { select: { id: true, name: true, slug: true } }
      }
    });

    // Index in multimodal collection
    const indexingResult = await indexMultiModalContent({
      id: post.id,
      text: processedContent.text,
      imageBuffer: processedContent.imageBuffer,
      documentBuffer: processedContent.documentBuffer,
      type: 'post',
      metadata: {
        title: post.title,
        userId: post.userId,
        categoryId: post.categoryId,
        createdAt: post.createdAt.toISOString(),
        ...processedContent.metadata
      }
    });

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        author: post.user,
        category: post.category
      },
      indexing: indexingResult,
      processing: {
        hasImage: !!processedContent.imageBuffer,
        hasDocument: !!processedContent.documentBuffer,
        extractedText: !!processedContent.text,
        metadata: processedContent.metadata
      }
    });

  } catch (error) {
    console.error('Multimodal upload error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Process image with compression and optional alt text generation
async function processImage(
  buffer: Buffer, 
  options: { 
    maxWidth: number; 
    quality: number; 
    generateAltText: boolean;
  }
): Promise<{
  buffer: Buffer;
  metadata: any;
  altText?: string;
}> {
  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Process image for optimal size
    let processedBuffer = buffer;
    
    if (metadata.width && metadata.width > options.maxWidth) {
      processedBuffer = await sharp(buffer)
        .resize(options.maxWidth, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality: options.quality })
        .toBuffer();
    } else {
      processedBuffer = await sharp(buffer)
        .jpeg({ quality: options.quality })
        .toBuffer();
    }

    // Get updated metadata
    const processedMetadata = await sharp(processedBuffer).metadata();

    let altText = '';
    if (options.generateAltText) {
      // Generate alt text using image analysis
      // In production, this would use a vision model
      altText = await generateImageAltText(processedBuffer);
    }

    return {
      buffer: processedBuffer,
      metadata: {
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        originalSize: buffer.length,
        processedWidth: processedMetadata.width,
        processedHeight: processedMetadata.height,
        processedSize: processedBuffer.length,
        format: processedMetadata.format,
        compression: options.quality
      },
      altText
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
}

// Process document with text extraction
async function processDocument(
  buffer: Buffer,
  options: {
    extractText: boolean;
    fileType: string;
    fileName: string;
  }
): Promise<{
  metadata: any;
  extractedText?: string;
}> {
  try {
    let extractedText = '';
    const metadata: any = {
      originalSize: buffer.length,
      fileType: options.fileType,
      fileName: options.fileName
    };

    if (options.extractText) {
      if (options.fileType === 'application/pdf') {
        // Extract text from PDF
        try {
          const pdfParse = require('pdf-parse');
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text;
          metadata.pages = pdfData.numpages;
          metadata.pdfInfo = pdfData.info;
        } catch (error) {
          console.error('PDF parsing failed:', error);
          extractedText = 'PDF text extraction failed';
        }
      } else if (options.fileType.includes('word') || options.fileType.includes('document')) {
        // Extract text from Word document
        try {
          const mammoth = require('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
          metadata.extractionMessages = result.messages;
        } catch (error) {
          console.error('Word document parsing failed:', error);
          extractedText = 'Word document text extraction failed';
        }
      } else if (options.fileType === 'text/plain') {
        extractedText = buffer.toString('utf-8');
      } else {
        extractedText = 'Text extraction not supported for this file type';
      }
    }

    return {
      metadata,
      extractedText: extractedText || undefined
    };
  } catch (error) {
    console.error('Document processing error:', error);
    throw new Error('Failed to process document');
  }
}

// Generate alt text for images (mock implementation)
async function generateImageAltText(imageBuffer: Buffer): Promise<string> {
  try {
    // In production, this would use a vision model like CLIP or GPT-4V
    // For now, return a generic description
    const metadata = await sharp(imageBuffer).metadata();
    
    const descriptions = [
      'An uploaded image',
      'Visual content shared by user',
      'Image containing visual information',
      'User-generated visual content',
      'Shared image with visual elements'
    ];
    
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    return `${randomDescription} (${metadata.width}x${metadata.height}, ${metadata.format?.toUpperCase()})`;
  } catch (error) {
    console.error('Alt text generation error:', error);
    return 'Image uploaded by user';
  }
}

// GET endpoint for retrieving upload status or configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      config: {
        maxFileSize: MAX_FILE_SIZE,
        maxFileSizeMB: MAX_FILE_SIZE / 1024 / 1024,
        allowedImageTypes: ALLOWED_IMAGE_TYPES,
        allowedDocumentTypes: ALLOWED_DOCUMENT_TYPES,
        maxImageDimension: parseInt(process.env.MAX_IMAGE_DIMENSION || '1920'),
        imageQuality: parseInt(process.env.IMAGE_QUALITY || '80'),
        features: {
          textExtraction: true,
          altTextGeneration: true,
          imageCompression: process.env.ENABLE_IMAGE_COMPRESSION === 'true',
          multimodalIndexing: true
        }
      }
    });
  } catch (error) {
    console.error('GET upload config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
