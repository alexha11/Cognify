"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  HelpCircle,
  Lightbulb,
  BookOpen,
} from "lucide-react";

interface Answer {
  id?: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  content: string;
  hint?: string;
  courseId: string;
  answers: Answer[];
  approved: boolean;
  aiGenerated: boolean;
}

interface Course {
  id: string;
  name: string;
}

export default function QuestionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    content: "",
    hint: "",
  });
  const [newAnswers, setNewAnswers] = useState<Answer[]>([
    { content: "", isCorrect: true },
    { content: "", isCorrect: false },
  ]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const canManage = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

  // Fetch courses for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      if (authLoading || !user) return;
      try {
        const data = await apiGet<Course[]>("/courses");
        setCourses(data || []);
        if (data && data.length > 0) {
          setSelectedCourse(data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch courses", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [authLoading, user]);

  // Fetch questions when course changes
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedCourse) return;
      try {
        setIsLoading(true);
        const data = await apiGet<Question[]>(
          `/questions/course/${selectedCourse}`,
        );
        setQuestions(data || []);
      } catch (error) {
        console.error("Failed to fetch questions", error);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [selectedCourse]);

  const addAnswer = () => {
    if (newAnswers.length < 6) {
      setNewAnswers([...newAnswers, { content: "", isCorrect: false }]);
    }
  };

  const removeAnswer = (index: number) => {
    if (newAnswers.length > 2) {
      const updated = newAnswers.filter((_, i) => i !== index);
      // Ensure at least one answer is correct
      if (!updated.some((a) => a.isCorrect) && updated.length > 0) {
        updated[0].isCorrect = true;
      }
      setNewAnswers(updated);
    }
  };

  const updateAnswer = (
    index: number,
    field: keyof Answer,
    value: string | boolean,
  ) => {
    const updated = [...newAnswers];
    if (field === "isCorrect" && value === true) {
      // Only one correct answer
      updated.forEach((a, i) => {
        a.isCorrect = i === index;
      });
    } else if (field === "content") {
      updated[index].content = value as string;
    } else if (field === "isCorrect") {
      updated[index].isCorrect = value as boolean;
    }
    setNewAnswers(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      setError("Please select a course first");
      return;
    }

    // Validation
    if (newQuestion.content.length < 10) {
      setError("Question must be at least 10 characters");
      return;
    }
    if (!newAnswers.some((a) => a.isCorrect)) {
      setError("Please mark one answer as correct");
      return;
    }
    if (newAnswers.some((a) => !a.content.trim())) {
      setError("All answers must have content");
      return;
    }

    setCreating(true);
    setError("");

    try {
      console.log("[Questions] Creating question:", {
        newQuestion,
        newAnswers,
        selectedCourse,
      });
      await apiPost("/questions", {
        content: newQuestion.content,
        hint: newQuestion.hint || undefined,
        courseId: selectedCourse,
        answers: newAnswers,
      });

      // Reset form
      setNewQuestion({ content: "", hint: "" });
      setNewAnswers([
        { content: "", isCorrect: true },
        { content: "", isCorrect: false },
      ]);
      setShowCreate(false);

      // Refresh questions
      const data = await apiGet<Question[]>(
        `/questions/course/${selectedCourse}`,
      );
      setQuestions(data || []);
    } catch (err: unknown) {
      console.error("[Questions] Creation failed:", err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to create question");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      await apiDelete(`/questions/${questionId}`);
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error("Failed to delete question", err);
    }
  };

  if (!isMounted) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Question Bank
            </h1>
            <p className="mt-1 text-gray-500">
              Manage questions and answers for your courses
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>
          )}
        </div>

        {/* Course Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Course
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a course --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No questions yet
            </h3>
            <p className="mt-2 text-gray-500">
              {selectedCourse
                ? "Add your first question to this course"
                : "Select a course to view questions"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        Q{index + 1}
                      </span>
                      {question.aiGenerated && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                          AI Generated
                        </span>
                      )}
                      {!question.approved && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                          Pending Approval
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {question.content}
                    </p>
                    {question.hint && (
                      <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                        <Lightbulb className="w-4 h-4" />
                        {question.hint}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Answers */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {question.answers.map((answer) => (
                    <div
                      key={answer.id}
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        answer.isCorrect
                          ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800"
                          : "bg-gray-50 dark:bg-gray-700/50"
                      }`}
                    >
                      {answer.isCorrect ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                      <span
                        className={
                          answer.isCorrect
                            ? "text-green-700 dark:text-green-400"
                            : "text-gray-600 dark:text-gray-300"
                        }
                      >
                        {answer.content}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Question Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold dark:text-white">
                  Add New Question
                </h2>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Question Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question *
                  </label>
                  <textarea
                    value={newQuestion.content}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        content: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your question..."
                    required
                    minLength={10}
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {newQuestion.content.length}/500 characters
                  </p>
                </div>

                {/* Hint */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hint (optional)
                  </label>
                  <input
                    type="text"
                    value={newQuestion.hint}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, hint: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional hint for students..."
                    maxLength={200}
                  />
                </div>

                {/* Answers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Answers * (minimum 2, maximum 6)
                    </label>
                    {newAnswers.length < 6 && (
                      <button
                        type="button"
                        onClick={addAnswer}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Add Answer
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {newAnswers.map((answer, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateAnswer(index, "isCorrect", true)}
                          className={`p-2 rounded-lg border transition-colors ${
                            answer.isCorrect
                              ? "bg-green-100 border-green-500 text-green-700"
                              : "bg-gray-50 border-gray-300 text-gray-400 hover:border-green-500"
                          }`}
                          title="Mark as correct answer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={answer.content}
                          onChange={(e) =>
                            updateAnswer(index, "content", e.target.value)
                          }
                          className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                          placeholder={`Answer ${index + 1}...`}
                          required
                          maxLength={200}
                        />
                        {newAnswers.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeAnswer(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Click the checkmark to mark the correct answer
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setError("");
                      setNewQuestion({ content: "", hint: "" });
                      setNewAnswers([
                        { content: "", isCorrect: true },
                        { content: "", isCorrect: false },
                      ]);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {creating ? "Creating..." : "Create Question"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
