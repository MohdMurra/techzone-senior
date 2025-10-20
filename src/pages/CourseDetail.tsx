import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { Clock, BookOpen, CheckCircle, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CourseDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      return data;
    }
  });

  const { data: lessons } = useQuery({
    queryKey: ['lessons', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order_index', { ascending: true });
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

  const { data: enrollment } = useQuery({
    queryKey: ['enrollment', id, session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', id)
        .eq('user_id', session.user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!session?.user?.id
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error('Please sign in to enroll');
      
      const { error } = await supabase
        .from('course_enrollments')
        .insert([{
          user_id: session.user.id,
          course_id: id,
          progress: 0
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', id] });
      toast({
        title: "Successfully enrolled!",
        description: "You can now access all course lessons."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Enrollment failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container py-8">Loading...</div>
      </div>
    );
  }

  const isEnrolled = !!enrollment;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="aspect-video overflow-hidden rounded-lg mb-6">
              <img 
                src={course.image_url || '/placeholder.svg'} 
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            
            <div className="flex items-center gap-4 mb-6 text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {course.duration_hours} hours
              </span>
              <span className="capitalize bg-primary/10 text-primary px-3 py-1 rounded">
                {course.level}
              </span>
              <span>by {course.instructor}</span>
            </div>

            <p className="text-lg mb-8">{course.description}</p>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Course Content</h2>
              {lessons?.map((lesson, index) => (
                <Card key={lesson.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{lesson.title}</CardTitle>
                        {lesson.description && (
                          <CardDescription>{lesson.description}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lesson.duration_minutes && (
                        <span className="text-sm text-muted-foreground">
                          {lesson.duration_minutes} min
                        </span>
                      )}
                      {isEnrolled && (
                        <Link to={`/lesson/${lesson.id}`}>
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-3xl">
                  ${Number(course.price).toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEnrolled ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">You're enrolled!</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Progress: {enrollment?.progress || 0}%
                    </div>
                    {lessons && lessons.length > 0 && (
                      <Link to={`/lesson/${lessons[0].id}`}>
                        <Button className="w-full">
                          Continue Learning
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                  </Button>
                )}
                
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lessons?.length || 0} lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{course.duration_hours} hours total</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}