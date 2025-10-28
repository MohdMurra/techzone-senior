import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Heart, ExternalLink, MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Builds() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

  const { data: publicBuilds } = useQuery({
    queryKey: ['public-builds'],
    queryFn: async () => {
      const { data: buildsData } = await supabase
        .from('builds')
        .select('*')
        .eq('is_public', true)
        .order('likes_count', { ascending: false });
      
      if (!buildsData) return [];
      
      // Fetch profiles for build creators
      const userIds = [...new Set(buildsData.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      // Combine builds with creator profiles
      return buildsData.map(build => ({
        ...build,
        creator: profiles?.find(p => p.id === build.user_id)
      }));
    }
  });

  const { data: userLikes } = useQuery({
    queryKey: ['user-likes', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data } = await supabase
        .from('build_likes')
        .select('build_id')
        .eq('user_id', session.user.id);
      return data || [];
    },
    enabled: !!session?.user?.id
  });

  const { data: buildComments } = useQuery({
    queryKey: ['build-comments'],
    queryFn: async () => {
      const { data: comments } = await supabase
        .from('build_comments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!comments) return [];
      
      // Fetch user profiles separately
      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      // Combine comments with profiles
      return comments.map(comment => ({
        ...comment,
        user_profile: profiles?.find(p => p.id === comment.user_id)
      }));
    }
  });

  const likeMutation = useMutation({
    mutationFn: async ({ buildId, isLiked }: { buildId: string; isLiked: boolean }) => {
      if (!session?.user?.id) throw new Error('Please sign in to like builds');

      if (isLiked) {
        const { error } = await supabase
          .from('build_likes')
          .delete()
          .eq('build_id', buildId)
          .eq('user_id', session.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('build_likes')
          .insert([{ build_id: buildId, user_id: session.user.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-builds'] });
      queryClient.invalidateQueries({ queryKey: ['user-likes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async ({ buildId, content }: { buildId: string; content: string }) => {
      if (!session?.user?.id) throw new Error('Please sign in to comment');
      
      const { error } = await supabase
        .from('build_comments')
        .insert([{ build_id: buildId, user_id: session.user.id, content }]);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['build-comments'] });
      setCommentTexts(prev => ({ ...prev, [variables.buildId]: '' }));
      toast({ title: "Comment posted!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const toggleComments = (buildId: string) => {
    setExpandedComments(prev => ({ ...prev, [buildId]: !prev[buildId] }));
  };

  const handleLike = (buildId: string) => {
    const isLiked = userLikes?.some(like => like.build_id === buildId) || false;
    likeMutation.mutate({ buildId, isLiked });
  };

  const handleComment = (buildId: string) => {
    const content = commentTexts[buildId]?.trim();
    if (!content) return;
    commentMutation.mutate({ buildId, content });
  };

  const getBuildComments = (buildId: string) => {
    return buildComments?.filter(comment => comment.build_id === buildId) || [];
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Community Builds</h1>
          <p className="text-muted-foreground">
            Explore PC builds created by our community
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicBuilds && publicBuilds.length > 0 ? (
            publicBuilds.map((build) => {
              const isLiked = userLikes?.some(like => like.build_id === build.id) || false;
              const comments = getBuildComments(build.id);
              const showComments = expandedComments[build.id];
              
              return (
                <Card key={build.id}>
                  <CardHeader>
                    <CardTitle>{build.name}</CardTitle>
                    {build.description && (
                      <CardDescription>{build.description}</CardDescription>
                    )}
                    <div className="text-sm text-muted-foreground mt-2">
                      By {build.creator?.full_name || build.creator?.email || 'Anonymous'}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-primary">
                          ${build.total_price ? Number(build.total_price).toFixed(2) : '0.00'}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleLike(build.id)}
                            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Heart 
                              className={`h-5 w-5 ${isLiked ? 'fill-primary text-primary' : ''}`}
                            />
                            <span>{build.likes_count || 0}</span>
                          </button>
                          <button
                            onClick={() => toggleComments(build.id)}
                            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <MessageCircle className="h-5 w-5" />
                            <span>{comments.length}</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(build.created_at).toLocaleDateString()}
                      </div>

                      <Link to={`/builder?load=${build.id}`}>
                        <Button className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Build
                        </Button>
                      </Link>

                      {showComments && (
                        <div className="pt-4 border-t space-y-3">
                          <h4 className="font-semibold text-sm">Comments</h4>
                          {comments.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {comments.map((comment) => (
                                <div key={comment.id} className="text-sm bg-muted p-2 rounded">
                                  <div className="font-semibold text-xs text-muted-foreground mb-1">
                                    {comment.user_profile?.full_name || comment.user_profile?.email || 'Anonymous'}
                                  </div>
                                  <p>{comment.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No comments yet</p>
                          )}
                          
                          {session?.user && (
                            <div className="flex gap-2">
                              <Textarea
                                placeholder="Add a comment..."
                                value={commentTexts[build.id] || ''}
                                onChange={(e) => setCommentTexts(prev => ({ ...prev, [build.id]: e.target.value }))}
                                className="min-h-[60px]"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleComment(build.id)}
                                disabled={!commentTexts[build.id]?.trim() || commentMutation.isPending}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">No public builds yet</p>
              <Link to="/builder">
                <Button>Create Your First Build</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}