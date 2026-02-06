'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { Question, AttemptResult, CourseProgress } from '@/types';
import { ArrowLeft, Check, X, Lightbulb, ArrowRight, Trophy, Loader2 } from 'lucide-react';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questionsRes, progressRes] = await Promise.all([
          api.get(`/questions/course/${courseId}`),
          api.get(`/attempts/course/${courseId}`),
        ]);
        
        const allQuestions = questionsRes.data as Question[];
        const courseProgress = progressRes.data as CourseProgress;
        
        // Filter out already answered questions
        const attemptedIds = new Set<string>();
        const attemptsRes = await api.get('/attempts/me');
        (attemptsRes.data as { question: Question }[]).forEach((a) => attemptedIds.add(a.question.id));
        
        const unanswered = allQuestions.filter(q => !attemptedIds.has(q.id));
        
        setQuestions(unanswered);
        setProgress(courseProgress);
        
        if (unanswered.length === 0) {
          setCompleted(true);
        }
      } catch (error) {
        console.error('Failed to fetch questions', error);
        router.push('/courses');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, router]);

  const currentQuestion = questions[currentIndex];

  const handleSubmit = async () => {
    if (!selectedAnswer || !currentQuestion) return;
    
    setIsSubmitting(true);
    try {
      const res = await api.post('/attempts', {
        questionId: currentQuestion.id,
        selectedAnswerId: selectedAnswer,
      });
      setResult(res.data);
    } catch (error) {
      console.error('Failed to submit answer', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setResult(null);
    } else {
      setCompleted(true);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (completed) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quiz Complete!
          </h1>
          <p className="mt-4 text-gray-500">
            You&apos;ve answered all available questions for this course.
          </p>
          {progress && (
            <div className="mt-6 p-6 bg-gray-50 rounded-xl dark:bg-gray-900">
              <p className="text-sm text-gray-500">Your Score</p>
              <p className="text-4xl font-bold text-indigo-600">{progress.percentage}%</p>
              <p className="text-sm text-gray-500 mt-2">
                {progress.correct} out of {progress.totalQuestions} correct
              </p>
            </div>
          )}
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/progress">
              <Button>View Progress</Button>
            </Link>
            <Link href="/courses">
              <Button variant="outline">Back to Courses</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentQuestion) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">No questions available</p>
          <Link href="/courses">
            <Button className="mt-4">Back to Courses</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={`/courses/${courseId}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            Back to course
          </Link>
          <Badge variant="secondary">
            Question {currentIndex + 1} of {questions.length}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-800">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${((currentIndex + (result ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">
              {currentQuestion.content}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.answers.map((answer, index) => {
              const letter = String.fromCharCode(65 + index);
              const isSelected = selectedAnswer === answer.id;
              const showResult = result !== null;
              const isCorrect = answer.isCorrect;
              const wasSelected = result?.selectedAnswer.id === answer.id;
              
              let bgClass = 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800';
              let borderClass = 'border-gray-200 dark:border-gray-800';
              
              if (showResult) {
                if (isCorrect) {
                  bgClass = 'bg-green-50 dark:bg-green-900/20';
                  borderClass = 'border-green-500';
                } else if (wasSelected && !isCorrect) {
                  bgClass = 'bg-red-50 dark:bg-red-900/20';
                  borderClass = 'border-red-500';
                }
              } else if (isSelected) {
                bgClass = 'bg-indigo-50 dark:bg-indigo-900/20';
                borderClass = 'border-indigo-500';
              }
              
              return (
                <button
                  key={answer.id}
                  onClick={() => !result && setSelectedAnswer(answer.id)}
                  disabled={!!result}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${bgClass} ${borderClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-medium ${
                      isSelected && !showResult ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {letter}
                    </span>
                    <span className="flex-1">{answer.content}</span>
                    {showResult && isCorrect && <Check className="h-5 w-5 text-green-600" />}
                    {showResult && wasSelected && !isCorrect && <X className="h-5 w-5 text-red-600" />}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Result & Hint */}
        {result && (
          <Card className={result.isCorrect ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {result.isCorrect ? (
                  <Check className="h-6 w-6 text-green-600" />
                ) : (
                  <X className="h-6 w-6 text-red-600" />
                )}
                <p className={`font-semibold ${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {result.isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
              </div>
              {result.hint && !result.isCorrect && (
                <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500" />
                  <p>{result.hint}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {!result ? (
            <Button onClick={handleSubmit} disabled={!selectedAnswer || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {currentIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                'Finish Quiz'
              )}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
