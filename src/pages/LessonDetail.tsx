import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

export default function LessonDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

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

  const { data: completedLessons } = useQuery({
    queryKey: ['lesson-completions', lesson?.course_id, session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id || !lesson?.course_id) return [];
      const { data } = await supabase
        .from('lesson_completions')
        .select('lesson_id')
        .eq('user_id', session.user.id)
        .eq('course_id', lesson.course_id);
      return data?.map(c => c.lesson_id) || [];
    },
    enabled: !!session?.user?.id && !!lesson?.course_id
  });

  const { data: enrollment } = useQuery({
    queryKey: ['enrollment', lesson?.course_id, session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id || !lesson?.course_id) return null;
      const { data } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', lesson.course_id)
        .eq('user_id', session.user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!session?.user?.id && !!lesson?.course_id
  });

  const completeAndContinueMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!session?.user?.id || !lesson?.course_id) return;

      // Mark lesson as complete
      const { error: completionError } = await supabase
        .from('lesson_completions')
        .upsert({
          user_id: session.user.id,
          lesson_id: lessonId,
          course_id: lesson.course_id
        }, { onConflict: 'user_id,lesson_id' });

      if (completionError) throw completionError;

      // Calculate new progress
      const totalLessons = allLessons?.length || 1;
      const completedCount = (completedLessons?.length || 0) + (completedLessons?.includes(lessonId) ? 0 : 1);
      const newProgress = Math.round((completedCount / totalLessons) * 100);

      // Update enrollment progress
      const { error: updateError } = await supabase
        .from('course_enrollments')
        .update({ 
          progress: newProgress,
          completed_at: newProgress === 100 ? new Date().toISOString() : null
        })
        .eq('user_id', session.user.id)
        .eq('course_id', lesson.course_id);

      if (updateError) throw updateError;

      return newProgress;
    },
    onSuccess: (newProgress) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-completions'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      
      if (newProgress === 100) {
        toast({
          title: "🎉 Course Completed!",
          description: "Congratulations! You can now download your certificate."
        });
      } else {
        toast({
          title: "Lesson completed!",
          description: `Progress: ${newProgress}%`
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleMarkComplete = () => {
    if (id) {
      completeAndContinueMutation.mutate(id);
    }
  };

  const generateCertificate = () => {
    if (!lesson?.courses || !session?.user) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Background
    doc.setFillColor(15, 23, 42); // Dark blue background
    doc.rect(0, 0, 297, 210, 'F');

    // Border
    doc.setDrawColor(59, 130, 246); // Blue border
    doc.setLineWidth(3);
    doc.rect(10, 10, 277, 190);

    // Inner border
    doc.setDrawColor(147, 197, 253);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 267, 180);

    // Certificate title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(255, 255, 255);
    doc.text('CERTIFICATE OF COMPLETION', 148.5, 50, { align: 'center' });

    // Decorative line
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(74, 58, 223, 58);

    // "This is to certify that"
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(203, 213, 225);
    doc.text('This is to certify that', 148.5, 75, { align: 'center' });

    // User name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(59, 130, 246);
    doc.text(session.user.email || 'Student', 148.5, 92, { align: 'center' });

    // "has successfully completed"
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(203, 213, 225);
    doc.text('has successfully completed the course', 148.5, 108, { align: 'center' });

    // Course name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(lesson.courses.title, 148.5, 125, { align: 'center' });

    // Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184);
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Completed on ${date}`, 148.5, 145, { align: 'center' });

    // Platform name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text('RigFreaks Learning Hub', 148.5, 175, { align: 'center' });

    // Award icon placeholder text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('Certificate ID: ' + crypto.randomUUID().slice(0, 8).toUpperCase(), 148.5, 185, { align: 'center' });

    // Save the PDF
    doc.save(`Certificate-${lesson.courses.title.replace(/\s+/g, '-')}.pdf`);

    toast({
      title: "Certificate Downloaded!",
      description: "Your completion certificate has been saved."
    });
  };

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
  const isCurrentCompleted = completedLessons?.includes(lesson.id);
  const isLastLesson = !nextLesson;
  const isCourseComplete = enrollment?.progress === 100;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <Link to={`/course/${lesson.course_id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
          </Link>
          
          {enrollment && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Progress: {enrollment.progress || 0}%
              </div>
              <div className="w-32 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all" 
                  style={{ width: `${enrollment.progress || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">{lesson.title}</h1>
            {isCurrentCompleted && (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
          </div>
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

          {/* Certificate Download for Completed Course */}
          {isCourseComplete && (
            <Card className="mb-8 border-green-500/50 bg-green-500/5">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="h-10 w-10 text-green-600" />
                    <div>
                      <h3 className="font-bold text-lg">Course Completed!</h3>
                      <p className="text-muted-foreground">Download your certificate of completion</p>
                    </div>
                  </div>
                  <Button onClick={generateCertificate} className="bg-green-600 hover:bg-green-700">
                    <Award className="h-4 w-4 mr-2" />
                    Download Certificate
                  </Button>
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
            
            <div className="flex gap-3">
              {!isCurrentCompleted && session?.user && (
                <Button 
                  variant="outline"
                  onClick={handleMarkComplete}
                  disabled={completeAndContinueMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}
              
              {nextLesson ? (
                <Link to={`/lesson/${nextLesson.id}`}>
                  <Button 
                    onClick={() => {
                      if (!isCurrentCompleted && session?.user && id) {
                        completeAndContinueMutation.mutate(id);
                      }
                    }}
                  >
                    {isCurrentCompleted ? 'Next Lesson' : 'Complete & Continue'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={() => {
                    if (!isCurrentCompleted && session?.user && id) {
                      completeAndContinueMutation.mutate(id);
                    }
                  }}
                  className={isCourseComplete ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {isCourseComplete ? (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      Course Complete!
                    </>
                  ) : (
                    'Complete Course'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
