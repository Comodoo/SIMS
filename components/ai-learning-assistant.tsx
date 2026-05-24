'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
  Brain,
  Lightbulb,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIMessage, AIMessageContext, AIQuizQuestion, AILectureSummary } from '@/lib/types';

interface AILearningAssistantProps {
  courseId?: string;
  lessonId?: string;
  courseName?: string;
  lessonName?: string;
  lessonContent?: string;
  isFloating?: boolean;
  onClose?: () => void;
}

const SAMPLE_SUGGESTIONS = [
  'Explain this concept in simpler terms',
  'Give me a practice quiz on this topic',
  'Summarize the key points',
  'What are the real-world applications?',
  'Help me understand the prerequisites',
];

export function AILearningAssistant({
  courseId,
  lessonId,
  courseName,
  lessonName,
  lessonContent,
  isFloating = true,
  onClose,
}: AILearningAssistantProps) {
  const [isOpen, setIsOpen] = useState(!isFloating);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'summary'>('chat');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<AIQuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [summary, setSummary] = useState<AILectureSummary | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: AIMessage = {
        id: 'welcome',
        role: 'assistant',
        content: lessonName
          ? `Hi! I'm your AI learning assistant for "${lessonName}". I can help you understand concepts, generate practice quizzes, summarize lectures, and answer any questions you have. How can I help you today?`
          : `Hi! I'm your AI learning assistant. I can help you understand concepts, generate practice quizzes, summarize lectures, and answer any questions you have about your courses. What would you like to learn about?`,
        timestamp: new Date(),
        suggestions: SAMPLE_SUGGESTIONS.slice(0, 3),
      };
      setMessages([welcomeMessage]);
    }
  }, [lessonName, messages.length]);

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI response generation
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('explain') || lowerMessage.includes('simpler')) {
      return `Let me break this down for you:\n\n**Key Concept:**\nThis topic focuses on understanding the fundamental principles and how they connect to real-world applications.\n\n**Simple Explanation:**\nThink of it like building blocks - each concept builds upon the previous one. Start with the basics, understand the core idea, then gradually add complexity.\n\n**Example:**\nImagine you're learning to cook. First, you learn basic techniques (cutting, measuring), then you combine them into simple recipes, and eventually you can create complex dishes.\n\n**Key Takeaways:**\n1. Start with foundational concepts\n2. Practice with simple examples\n3. Build complexity gradually\n4. Connect theory to practical applications`;
    }

    if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
      return `I've generated a practice quiz for you! Click the "Quiz" tab above to take it.\n\nThe quiz includes:\n- Multiple choice questions\n- Varying difficulty levels\n- Instant feedback on your answers\n\nGood luck! Remember, this is for practice - focus on understanding rather than memorization.`;
    }

    if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
      return `**Lecture Summary:**\n\n**Main Topic:**\n${lessonName || 'This lesson'} covers essential concepts that form the foundation for more advanced topics.\n\n**Key Points:**\n1. Understanding core principles is crucial\n2. Practical application reinforces learning\n3. Regular practice improves retention\n\n**Important Concepts:**\n- Foundational knowledge builds expertise\n- Theory connects to real-world scenarios\n- Continuous learning drives mastery\n\n**Next Steps:**\n- Complete the practice exercises\n- Review the supplementary materials\n- Apply concepts to a small project`;
    }

    if (lowerMessage.includes('application') || lowerMessage.includes('real-world')) {
      return `**Real-World Applications:**\n\n**Industry Uses:**\n1. **Technology:** Used in software development, system design, and automation\n2. **Business:** Applied in process optimization and decision-making\n3. **Research:** Fundamental to scientific discoveries and innovations\n\n**Career Relevance:**\n- These skills are highly valued across industries\n- Companies actively seek professionals with this knowledge\n- Opens doors to diverse career paths\n\n**Practical Projects:**\n- Build a portfolio project using these concepts\n- Contribute to open-source projects\n- Create solutions for real problems in your community`;
    }

    if (lowerMessage.includes('prerequisite') || lowerMessage.includes('before')) {
      return `**Prerequisites for This Topic:**\n\n**Required Knowledge:**\n1. Basic understanding of fundamental concepts\n2. Familiarity with related terminology\n3. Some hands-on experience (recommended)\n\n**Recommended Preparation:**\n- Review introductory materials\n- Complete beginner-level courses\n- Practice basic exercises\n\n**If You're New:**\nDon't worry! This course is designed to be accessible. We'll build up from the basics, and I'm here to help explain anything that's unclear.`;
    }

    // Default response
    return `That's a great question about ${lessonName || 'this topic'}!\n\n**Here's what you need to know:**\n\nThis concept is fundamental to understanding the broader subject. Let me explain the key aspects:\n\n1. **Core Principle:** Every concept has a foundational idea that everything else builds upon\n\n2. **How It Works:** By understanding the mechanics, you can apply this knowledge in various situations\n\n3. **Why It Matters:** This knowledge enables you to solve complex problems and create innovative solutions\n\n**Tips for Mastery:**\n- Practice regularly with exercises\n- Connect new concepts to what you already know\n- Ask questions when something isn't clear\n\nWould you like me to elaborate on any specific aspect?`;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      context: {
        courseId,
        lessonId,
        topicName: lessonName,
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Check if user wants a quiz
    if (input.toLowerCase().includes('quiz')) {
      generateQuiz();
    }

    try {
      const response = await generateAIResponse(input);
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        suggestions: SAMPLE_SUGGESTIONS.slice(0, 2),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = () => {
    const sampleQuiz: AIQuizQuestion[] = [
      {
        id: '1',
        question: 'What is the primary purpose of understanding core concepts before advancing?',
        options: [
          'To memorize information',
          'To build a strong foundation for complex topics',
          'To pass exams quickly',
          'To skip practical exercises',
        ],
        correctIndex: 1,
        explanation: 'Building a strong foundation helps you understand and apply complex topics more effectively.',
        difficulty: 'easy',
      },
      {
        id: '2',
        question: 'Which approach is most effective for long-term learning retention?',
        options: [
          'Cramming before tests',
          'Reading once and moving on',
          'Regular practice and application',
          'Memorizing without understanding',
        ],
        correctIndex: 2,
        explanation: 'Regular practice and real-world application reinforce learning and improve retention.',
        difficulty: 'medium',
      },
      {
        id: '3',
        question: 'How does connecting new knowledge to existing knowledge help learning?',
        options: [
          'It makes studying faster',
          'It creates neural pathways that enhance memory',
          'It reduces the need for practice',
          'It only helps with theory, not practice',
        ],
        correctIndex: 1,
        explanation: 'Connecting new information to existing knowledge creates stronger neural pathways, making it easier to recall and apply.',
        difficulty: 'hard',
      },
    ];
    setGeneratedQuiz(sampleQuiz);
    setQuizAnswers({});
    setShowQuizResults(false);
    setActiveTab('quiz');
  };

  const generateSummary = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const newSummary: AILectureSummary = {
      id: Date.now().toString(),
      lessonId: lessonId || '',
      keyPoints: [
        'Understanding foundational concepts is essential for mastery',
        'Practice and application reinforce theoretical knowledge',
        'Building connections between topics enhances retention',
        'Regular review prevents knowledge decay',
        'Real-world application solidifies understanding',
      ],
      summary: `This lesson covers the essential principles of ${lessonName || 'the topic'}. The content emphasizes building a strong foundation through understanding core concepts before progressing to advanced material. Key strategies include regular practice, connecting new knowledge to existing understanding, and applying concepts to real-world scenarios.`,
      concepts: [
        { term: 'Foundation Building', definition: 'The process of establishing core knowledge before advancing to complex topics' },
        { term: 'Active Learning', definition: 'Engaging with material through practice, questions, and application rather than passive reading' },
        { term: 'Knowledge Transfer', definition: 'Applying learned concepts to new situations and problems' },
        { term: 'Retention Strategies', definition: 'Techniques used to maintain and recall information over time' },
      ],
      generatedAt: new Date(),
    };
    
    setSummary(newSummary);
    setActiveTab('summary');
    setIsLoading(false);
  };

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  };

  const calculateQuizScore = () => {
    let correct = 0;
    generatedQuiz.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return {
      correct,
      total: generatedQuiz.length,
      percentage: Math.round((correct / generatedQuiz.length) * 100),
    };
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  if (isFloating && !isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 z-50"
      >
        <Bot className="h-6 w-6 text-white" />
      </Button>
    );
  }

  const containerClasses = isFloating
    ? 'fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] z-50 shadow-2xl'
    : 'w-full h-full';

  return (
    <Card className={cn(containerClasses, isMinimized ? 'h-14' : 'h-[600px] max-h-[calc(100vh-3rem)]')}>
      {/* Header */}
      <CardHeader className="p-3 border-b flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">AI Learning Assistant</CardTitle>
            {lessonName && !isMinimized && (
              <p className="text-xs text-white/80 truncate max-w-[180px]">{lessonName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          {(isFloating || onClose) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(100%-56px)]">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-col h-full">
            <TabsList className="grid grid-cols-3 mx-3 mt-3">
              <TabsTrigger value="chat" className="text-xs">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="quiz" className="text-xs">
                <Brain className="h-3.5 w-3.5 mr-1" />
                Quiz
              </TabsTrigger>
              <TabsTrigger value="summary" className="text-xs">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Summary
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
              <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-2',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%] rounded-lg p-3 text-sm',
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-muted'
                        )}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(message.content, message.id)}
                            >
                              {copiedId === message.id ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/50">
                            {message.suggestions.map((suggestion, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="cursor-pointer hover:bg-secondary/80 text-xs"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Quick Actions */}
              <div className="px-3 pb-2">
                <div className="flex gap-1 overflow-x-auto pb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs whitespace-nowrap"
                    onClick={generateQuiz}
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    Generate Quiz
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs whitespace-nowrap"
                    onClick={generateSummary}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Summarize
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs whitespace-nowrap"
                    onClick={() => handleSuggestionClick('Explain this concept in simpler terms')}
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Simplify
                  </Button>
                </div>
              </div>

              {/* Input */}
              <div className="p-3 pt-0 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Ask anything about this lesson..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                    className="text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Quiz Tab */}
            <TabsContent value="quiz" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full p-3">
                {generatedQuiz.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Brain className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">No Quiz Generated Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate a practice quiz based on the current lesson content
                    </p>
                    <Button onClick={generateQuiz} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Generate Quiz
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {showQuizResults ? (
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Quiz Results</h3>
                        <div className="text-3xl font-bold mb-2">
                          {calculateQuizScore().percentage}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {calculateQuizScore().correct} out of {calculateQuizScore().total} correct
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            setQuizAnswers({});
                            setShowQuizResults(false);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retake Quiz
                        </Button>
                      </div>
                    ) : null}

                    {generatedQuiz.map((question, qIdx) => (
                      <div key={question.id} className="border rounded-lg p-3">
                        <div className="flex items-start gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            Q{qIdx + 1}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs',
                              question.difficulty === 'easy' && 'bg-green-100 text-green-700',
                              question.difficulty === 'medium' && 'bg-yellow-100 text-yellow-700',
                              question.difficulty === 'hard' && 'bg-red-100 text-red-700'
                            )}
                          >
                            {question.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-3">{question.question}</p>
                        <div className="space-y-2">
                          {question.options.map((option, oIdx) => {
                            const isSelected = quizAnswers[question.id] === oIdx;
                            const isCorrect = oIdx === question.correctIndex;
                            const showResult = showQuizResults;

                            return (
                              <button
                                key={oIdx}
                                onClick={() => !showQuizResults && handleQuizAnswer(question.id, oIdx)}
                                className={cn(
                                  'w-full text-left p-2 rounded-lg border text-sm transition-colors',
                                  isSelected && !showResult && 'border-blue-500 bg-blue-50',
                                  showResult && isCorrect && 'border-green-500 bg-green-50',
                                  showResult && isSelected && !isCorrect && 'border-red-500 bg-red-50',
                                  !isSelected && !showResult && 'hover:bg-muted'
                                )}
                                disabled={showQuizResults}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        {showQuizResults && (
                          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                            <strong>Explanation:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                    ))}

                    {!showQuizResults && Object.keys(quizAnswers).length === generatedQuiz.length && (
                      <Button
                        className="w-full"
                        onClick={() => setShowQuizResults(true)}
                      >
                        Submit Quiz
                      </Button>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full p-3">
                {!summary ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">No Summary Generated Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate a summary of the current lesson content
                    </p>
                    <Button onClick={generateSummary} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Generate Summary
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Summary
                      </h3>
                      <p className="text-sm text-muted-foreground">{summary.summary}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Key Points
                      </h3>
                      <ul className="space-y-1">
                        {summary.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-green-500 mt-1">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Key Concepts
                      </h3>
                      <div className="space-y-2">
                        {summary.concepts.map((concept, idx) => (
                          <div key={idx} className="border rounded-lg p-2">
                            <p className="font-medium text-sm">{concept.term}</p>
                            <p className="text-xs text-muted-foreground">{concept.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => copyToClipboard(
                        `Summary:\n${summary.summary}\n\nKey Points:\n${summary.keyPoints.map(p => `• ${p}`).join('\n')}`,
                        'summary'
                      )}
                    >
                      {copiedId === 'summary' ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Summary
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}
