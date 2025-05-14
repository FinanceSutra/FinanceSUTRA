import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Badge, LearningModule, Lesson, UserBadge, UserProgress } from '@shared/schema';
import { Loader2, BookOpen, Award, CheckCircle, ChevronRight, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';

export default function LearningPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);

  // Fetch learning modules
  const { data: modules, isLoading: modulesLoading } = useQuery<LearningModule[]>({
    queryKey: ['/api/learning-modules'],
    enabled: !!user,
  });

  // Fetch lessons for selected module
  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ['/api/learning-modules', selectedModule, 'lessons'],
    enabled: !!selectedModule,
  });

  // Fetch user progress and badges
  const { data: userProgress, isLoading: progressLoading } = useQuery<UserProgress[]>({
    queryKey: ['/api/learning/progress'],
    enabled: !!user,
  });

  const { data: userBadges, isLoading: badgesLoading } = useQuery<{badges: Badge[], userBadges: UserBadge[]}>({
    queryKey: ['/api/learning/badges'],
    enabled: !!user,
  });

  const loading = modulesLoading || progressLoading || badgesLoading;

  // Handle clicking on a module
  const handleModuleClick = (moduleId: number) => {
    setSelectedModule(moduleId);
    setSelectedLesson(null);
  };

  // Handle clicking on a lesson
  const handleLessonClick = (lessonId: number) => {
    setSelectedLesson(lessonId);
  };

  // Calculate progress for a module
  const calculateModuleProgress = (moduleId: number) => {
    if (!userProgress || !lessons) return 0;
    
    const lessonCompletionCount = userProgress.filter(
      (progress) => progress.moduleId === moduleId && progress.completed
    ).length;
    
    const totalLessons = lessons.filter(lesson => lesson.moduleId === moduleId).length;
    return totalLessons ? Math.round((lessonCompletionCount / totalLessons) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning Center</h1>
        <p className="text-muted-foreground">Master trading strategies and concepts with interactive lessons and quizzes</p>
      </div>

      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="modules">Learning Modules</TabsTrigger>
          <TabsTrigger value="badges">Your Badges</TabsTrigger>
          <TabsTrigger value="progress">Progress Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          {!selectedModule ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules?.map((module) => (
                <Card key={module.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">{module.level}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                        {calculateModuleProgress(module.id)}% Complete
                      </span>
                    </div>
                    <Progress value={calculateModuleProgress(module.id)} className="h-2" />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleModuleClick(module.id)}
                    >
                      Start Learning <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : !selectedLesson ? (
            <div>
              <Button 
                variant="ghost" 
                className="mb-4"
                onClick={() => setSelectedModule(null)}
              >
                ← Back to Modules
              </Button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {modules?.find(m => m.id === selectedModule)?.title}
                </h2>
                <p className="text-muted-foreground">
                  {modules?.find(m => m.id === selectedModule)?.description}
                </p>
              </div>
              
              <div className="space-y-4">
                {lessonsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {lessons?.map((lesson) => (
                      <Card key={lesson.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <div className="flex items-start p-4">
                          <div className="mr-4 mt-1">
                            {userProgress?.some(p => p.lessonId === lesson.id && p.completed) ? (
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : (
                              <BookOpen className="h-6 w-6 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium mb-1">{lesson.title}</h3>
                            <p className="text-muted-foreground text-sm mb-3">{lesson.description}</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleLessonClick(lesson.id)}
                            >
                              {userProgress?.some(p => p.lessonId === lesson.id && p.completed) 
                                ? 'Review Lesson' 
                                : 'Start Lesson'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div>
              <Button 
                variant="ghost" 
                className="mb-4"
                onClick={() => setSelectedLesson(null)}
              >
                ← Back to Lessons
              </Button>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-2xl font-bold mb-4">
                  {lessons?.find(l => l.id === selectedLesson)?.title}
                </h2>
                
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ 
                    __html: lessons?.find(l => l.id === selectedLesson)?.content || '' 
                  }} />
                </div>
                
                <div className="mt-8 pt-6 border-t">
                  <div className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedLesson(null)}
                    >
                      Back to Lessons
                    </Button>
                    
                    <Button 
                      onClick={async () => {
                        try {
                          // Mark lesson as completed
                          const moduleId = selectedModule;
                          const lessonId = selectedLesson;
                          
                          if (moduleId && lessonId) {
                            // API call to mark lesson as completed
                            await fetch('/api/learning/progress', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                moduleId,
                                lessonId,
                                completed: true
                              }),
                            });
                            
                            // Invalidate the progress query to refresh data
                            queryClient.invalidateQueries({
                              queryKey: ['/api/learning/progress']
                            });
                            
                            toast({
                              title: "Lesson Completed!",
                              description: "Your progress has been saved.",
                            });
                          }
                        } catch (error) {
                          console.error('Error marking lesson as complete:', error);
                          toast({
                            title: "Error",
                            description: "Failed to save your progress.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Mark as Complete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-6">Your Achievements</h2>
            
            {badgesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {userBadges?.badges.map((badge) => {
                  const earned = userBadges.userBadges.some(ub => ub.badgeId === badge.id);
                  
                  return (
                    <div 
                      key={badge.id} 
                      className={`p-4 rounded-lg border text-center ${earned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}
                    >
                      <div className="flex justify-center mb-3">
                        <Award className={`h-12 w-12 ${earned ? 'text-yellow-500' : 'text-gray-400'}`} />
                      </div>
                      <h3 className="font-medium mb-1">{badge.name}</h3>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                      {earned && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          EARNED
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-6">Learning Progress</h2>
            
            {modules?.map((module) => (
              <div key={module.id} className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{module.title}</h3>
                  <span className="text-sm font-medium">
                    {calculateModuleProgress(module.id)}% Complete
                  </span>
                </div>
                <Progress value={calculateModuleProgress(module.id)} className="h-3" />
              </div>
            ))}
            
            <Separator className="my-6" />
            
            <div className="mt-6">
              <h3 className="font-medium mb-4">Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium">Lessons Completed</p>
                  <p className="text-2xl font-bold">
                    {userProgress?.filter(p => p.completed).length || 0}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-sm text-green-600 font-medium">Badges Earned</p>
                  <p className="text-2xl font-bold">
                    {userBadges?.userBadges.length || 0}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="text-sm text-purple-600 font-medium">Total Points</p>
                  <p className="text-2xl font-bold">
                    {/* Calculate total points from completed lessons and earned badges */}
                    {(userProgress?.filter(p => p.completed).length || 0) * 10 +
                     (userBadges?.userBadges.length || 0) * 50}
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-600 font-medium">Learning Streak</p>
                  <p className="text-2xl font-bold">
                    {/* This would be calculated based on consecutive days of activity */}
                    3 days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}