import { CommentSection } from "@/components/CommentSection";
import { getPostById } from "@/lib/data"; 

interface EnhancedCommentSectionProps {
  postId: string;
}

export async function EnhancedCommentSection({ postId }: EnhancedCommentSectionProps) {
  const post = await getPostById(postId);
  
  if (!post) {
    return <div>Post not found</div>;
  }
  
  return (
    <CommentSection 
      postId={postId} 
      voteScore={post.score || 0} 
      commentCount={post._count?.comments || 0} 
    />
  );
} 