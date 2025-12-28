import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { BookOpen, Clock, ArrowRight, Play, FileText, GraduationCap } from "lucide-react";

export default function LearningHub() {
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

  const { data: enrollments } = useQuery({
    queryKey: ['user-enrollments', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data } = await supabase
        .from('course_enrollments')
        .select('*, courses(*)')
        .eq('user_id', session.user.id);
      return data || [];
    },
    enabled: !!session?.user?.id
  });

  const { data: blogPosts } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .neq('category', 'tutorial')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  const { data: tutorials } = useQuery({
    queryKey: ['tutorials'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .eq('category', 'tutorial')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Learning Hub</h1>
          <p className="text-muted-foreground">
            Expand your knowledge with expert courses, video tutorials, and tech guides
          </p>
        </div>

        {/* My Enrolled Courses Section */}
        {session && enrollments && enrollments.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">My Enrolled Courses</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {enrollments.map((enrollment: any) => (
                <Card key={enrollment.id} className="hover:shadow-lg transition-shadow border-primary/20">
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={enrollment.courses?.image_url || '/placeholder.svg'} 
                      alt={enrollment.courses?.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base line-clamp-1">{enrollment.courses?.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${enrollment.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{enrollment.progress || 0}%</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link to={`/course/${enrollment.course_id}`}>
                      <Button size="sm" className="w-full">
                        Continue Learning
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="blog">Blog & Guides</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={course.image_url || '/placeholder.svg'} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span className="capitalize bg-primary/10 text-primary px-2 py-1 rounded">
                        {course.level}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration_hours}h
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary">
                        ${Number(course.price).toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        by {course.instructor}
                      </span>
                    </div>
                    <Link to={`/course/${course.id}`}>
                      <Button className="w-full">
                        View Course
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="blog">
            {/* Video Tutorials Section */}
            {tutorials && tutorials.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Play className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Video Tutorials</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tutorials.map((tutorial) => (
                    <Card key={tutorial.id} className="hover:shadow-lg transition-shadow group">
                      <div className="aspect-video overflow-hidden rounded-t-lg relative">
                        <img 
                          src={tutorial.image_url || '/placeholder.svg'} 
                          alt={tutorial.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
                            <Play className="h-8 w-8 text-primary-foreground ml-1" />
                          </div>
                        </div>
                        <span className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs rounded font-medium">
                          Tutorial
                        </span>
                      </div>
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{tutorial.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {tutorial.excerpt}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            by {tutorial.author}
                          </span>
                          <Link to={`/blog/${tutorial.slug}`}>
                            <Button variant="default" size="sm">
                              <Play className="h-4 w-4 mr-1" />
                              Watch
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Blog & Guides Section */}
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Articles & Guides</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts?.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={post.image_url || '/placeholder.svg'} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span className="capitalize bg-primary/10 text-primary px-2 py-1 rounded">
                        {post.category}
                      </span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        by {post.author}
                      </span>
                      <Link to={`/blog/${post.slug}`}>
                        <Button variant="outline" size="sm">
                          Read More
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}