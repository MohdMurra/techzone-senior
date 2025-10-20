import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function LessonDetail() {
  const { id } = useParams();

  const { data: lesson } = useQuery({
    queryKey: ['lesson', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('lessons')
        .select('*, courses(*)')
        .eq('id', id)
        .single();
      return data;
    }
  });

  const { data: allLessons } = useQuery({
    queryKey: ['course-lessons', lesson?.course_id],
    queryFn: async () => {
      if (!lesson?.course_id) return [];
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', lesson.course_id)
        .order('order_index', { ascending: true });
      return data || [];
    },
    enabled: !!lesson?.course_id
  });

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container py-8">Loading...</div>
      </div>
    );
  }

  const currentIndex = allLessons?.findIndex(l => l.id === lesson.id) ?? -1;
  const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null;
  const nextLesson = currentIndex < (allLessons?.length ?? 0) - 1 ? allLessons?.[currentIndex + 1] : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <div className="mb-6">
          <Link to={`/course/${lesson.course_id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-muted-foreground mb-6">{lesson.description}</p>
          )}

          {lesson.video_url && (
            <div className="aspect-video bg-muted rounded-lg mb-8 overflow-hidden">
              <iframe
                src={lesson.video_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          )}

          {lesson.content && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Lesson Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p>{lesson.content}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between items-center pt-8 border-t">
            {prevLesson ? (
              <Link to={`/lesson/${prevLesson.id}`}>
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous Lesson
                </Button>
              </Link>
            ) : (
              <div />
            )}
            
            {nextLesson ? (
              <Link to={`/lesson/${nextLesson.id}`}>
                <Button>
                  Next Lesson
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to={`/course/${lesson.course_id}`}>
                <Button>
                  Complete Course
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}