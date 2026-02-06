'use client';

import { BarChart3, TrendingUp, Check, Lock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import { FeatureGate } from './feature-gate';

export function ProgressTeaser() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Blurred Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 opacity-50 filter blur-[1px] pointer-events-none select-none">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <BarChart3 className="h-10 w-10 opacity-80" />
              <div>
                <p className="text-sm opacity-80 uppercase tracking-wider">Total Answered</p>
                <p className="text-3xl font-bold">128</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Check className="h-10 w-10 opacity-80" />
              <div>
                <p className="text-sm opacity-80 uppercase tracking-wider">Correct Answers</p>
                <p className="text-3xl font-bold">115</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-10 w-10 opacity-80" />
              <div>
                <p className="text-sm opacity-80 uppercase tracking-wider">Accuracy Rate</p>
                <p className="text-3xl font-bold">92%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Teaser Section */}
      <FeatureGate 
        variant="blur"
        title="Start Your Learning Journey"
        description="Every question you answer helps build your personalized learning profile. Sign up to save your progress and see detailed analytics."
      >
        <div className="min-h-[400px] rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center p-12 text-center">
            <div className="max-w-md space-y-6">
                <div className="mx-auto w-20 h-20 bg-indigo-50 dark:bg-indigo-900/40 rounded-3xl flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Visualize Your Growth</h2>
                <p className="text-gray-500">Track your performance across courses, identify weak spots, and master any subject with data-driven insights.</p>
            </div>
        </div>
      </FeatureGate>
    </div>
  );
}
