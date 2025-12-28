import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, User, Play, ExternalLink } from "lucide-react";

// YouTube video URLs for PC building tutorials
const tutorialVideos: Record<string, string> = {
  'pc-build-tutorial-complete': 'https://www.youtube.com/embed/BL4DCEp7blY',
  'gpu-installation-tutorial': 'https://www.youtube.com/embed/nyDxrTHDjXQ',
  'cable-management-tutorial': 'https://www.youtube.com/embed/c3dggnkaEs8'
};

export default function BlogDetail() {
  const { slug } = useParams();

  const { data: post } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();
      return data;
    }
  });

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container py-8">Loading...</div>
      </div>
    );
  }

  const isTutorial = post.category === 'tutorial';
  const videoUrl = slug ? tutorialVideos[slug] : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <div className="mb-6">
          <Link to="/learning-hub">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Learning Hub
            </Button>
          </Link>
        </div>

        <article className="max-w-4xl mx-auto">
          <div className="mb-6">
            <span className={`inline-block px-3 py-1 rounded-full text-sm mb-4 capitalize ${
              isTutorial ? 'bg-red-600 text-white' : 'bg-primary/10 text-primary'
            }`}>
              {isTutorial && <Play className="inline h-3 w-3 mr-1" />}
              {post.category}
            </span>
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Video Embed for Tutorials */}
          {isTutorial && videoUrl && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-red-600" />
                  Watch the Tutorial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <iframe
                    src={videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={post.title}
                  />
                </div>
                <div className="mt-4 flex justify-center">
                  <a 
                    href={videoUrl.replace('/embed/', '/watch?v=')} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Watch on YouTube
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Featured Image for Non-Tutorials */}
          {!isTutorial && post.image_url && (
            <div className="aspect-video overflow-hidden rounded-lg mb-8">
              <img 
                src={post.image_url} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{isTutorial ? 'Tutorial Description' : 'Article'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {post.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-lg leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Related Resources */}
          {isTutorial && (
            <Card className="mb-8 border-primary/20">
              <CardHeader>
                <CardTitle>Related Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link to="/learning-hub" className="block">
                    <div className="p-4 border rounded-lg hover:bg-muted transition-colors">
                      <h4 className="font-semibold mb-1">More Video Tutorials</h4>
                      <p className="text-sm text-muted-foreground">Browse all our PC building tutorials</p>
                    </div>
                  </Link>
                  <Link to="/builder" className="block">
                    <div className="p-4 border rounded-lg hover:bg-muted transition-colors">
                      <h4 className="font-semibold mb-1">PC Builder Tool</h4>
                      <p className="text-sm text-muted-foreground">Start building your own custom PC</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-12 pt-8 border-t">
            <Link to="/learning-hub">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Learning Hub
              </Button>
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}