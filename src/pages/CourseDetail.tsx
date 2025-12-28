import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Clock, BookOpen, CheckCircle, Play, ArrowLeft, Lock, Users, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CourseDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
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
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
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

  const handleEnroll = () => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to enroll in courses.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    // For paid courses, redirect to checkout
    if (course && Number(course.price) > 0) {
      // Store course info in sessionStorage for checkout
      sessionStorage.setItem('courseCheckout', JSON.stringify({
        courseId: id,
        courseTitle: course.title,
        coursePrice: course.price
      }));
      navigate('/course-checkout');
    } else {
      // Free course - enroll directly
      enrollMutation.mutate();
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container py-8">Loading...</div>
      </div>
    );
  }

  const isEnrolled = !!enrollment;
  const totalMinutes = lessons?.reduce((acc, lesson) => acc + (lesson.duration_minutes || 0), 0) || 0;
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

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
            
            <div className="flex flex-wrap items-center gap-4 mb-6 text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {course.duration_hours} hours
              </span>
              <span className="capitalize bg-primary/10 text-primary px-3 py-1 rounded">
                {course.level}
              </span>
              <span>by {course.instructor}</span>
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {lessons?.length || 0} lessons
              </span>
            </div>

            <p className="text-lg mb-8">{course.description}</p>

            {/* What You'll Learn */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  What You'll Learn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid md:grid-cols-2 gap-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Understand core concepts and fundamentals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Hands-on practical exercises</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Real-world application skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Industry best practices</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Course Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Course Content</h2>
                <span className="text-sm text-muted-foreground">
                  {lessons?.length} lessons • {totalHours > 0 && `${totalHours}h `}{remainingMinutes}m total
                </span>
              </div>

              {lessons && lessons.length > 0 ? (
                lessons.map((lesson, index) => (
                  <Card key={lesson.id} className={`transition-all ${isEnrolled ? 'hover:shadow-md' : 'opacity-80'}`}>
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                          isEnrolled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {lesson.title}
                            {lesson.video_url && <Play className="h-4 w-4 text-primary" />}
                          </CardTitle>
                          {lesson.description && (
                            <CardDescription className="mt-1">{lesson.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {lesson.duration_minutes && (
                          <span className="text-sm text-muted-foreground">
                            {lesson.duration_minutes} min
                          </span>
                        )}
                        {isEnrolled ? (
                          <Link to={`/lesson/${lesson.id}`}>
                            <Button size="sm">
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          </Link>
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Course content is being prepared. Check back soon!
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-3xl">
                  {Number(course.price) > 0 ? `$${Number(course.price).toFixed(2)}` : 'Free'}
                </CardTitle>
                {Number(course.price) > 0 && (
                  <CardDescription>One-time payment, lifetime access</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEnrolled ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">You're enrolled!</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{enrollment?.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${enrollment?.progress || 0}%` }}
                        />
                      </div>
                    </div>
                    {lessons && lessons.length > 0 && (
                      <Link to={`/lesson/${lessons[0].id}`}>
                        <Button className="w-full">
                          <Play className="h-4 w-4 mr-2" />
                          {enrollment?.progress ? 'Continue Learning' : 'Start Course'}
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? "Processing..." : 
                     Number(course.price) > 0 ? "Enroll Now - Checkout" : "Enroll for Free"}
                  </Button>
                )}
                
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold">This course includes:</h4>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lessons?.length || 0} lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{course.duration_hours} hours of content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Access on any device</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Certificate of completion</span>
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