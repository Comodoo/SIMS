'use client';

import { useState, useRef, useCallback } from 'react';
import { useLMS } from '@/lib/lms-context';
import { Section, Lesson, LessonFormData, SectionFormData, LessonType, Material, QuizQuestion, QuestionType } from '@/lib/types';
import { formatDuration } from '@/lib/sample-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  Eye,
  Paperclip,
  X,
  Clock,
  FolderPlus,
  Headphones,
  Images,
  GraduationCap,
  Upload,
  File,
  FileVideo,
  FileAudio,
  FileImage,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  Save,
  Cloud,
  CloudOff,
  Timer,
  Target,
  Shuffle,
  Award,
  MoreVertical,
  Copy,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CurriculumBuilderProps {
  courseId: string;
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  url?: string;
  error?: string;
}

const lessonTypeIcons: Record<LessonType, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  assignment: <ClipboardList className="h-4 w-4" />,
  audio: <Headphones className="h-4 w-4" />,
  slideshow: <Images className="h-4 w-4" />,
  exam: <GraduationCap className="h-4 w-4" />,
};

const lessonTypeLabels: Record<LessonType, string> = {
  video: 'Video',
  document: 'Document',
  quiz: 'Quiz',
  assignment: 'Assignment',
  audio: 'Audio',
  slideshow: 'Slideshow',
  exam: 'Exam',
};

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4 text-red-500" />,
  video: <FileVideo className="h-4 w-4 text-blue-500" />,
  audio: <FileAudio className="h-4 w-4 text-purple-500" />,
  image: <FileImage className="h-4 w-4 text-green-500" />,
  zip: <FileArchive className="h-4 w-4 text-amber-500" />,
  file: <File className="h-4 w-4 text-gray-500" />,
  link: <FileText className="h-4 w-4 text-blue-500" />,
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const generateId = () => Math.random().toString(36).substring(2, 15);

export default function CurriculumBuilder({ courseId }: CurriculumBuilderProps) {
  const { getCourse, addSection, updateSection, deleteSection, addLesson, updateLesson, deleteLesson, addMaterial, deleteMaterial } = useLMS();
  const course = getCourse(courseId);

  // Dialog states
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizBuilderOpen, setQuizBuilderOpen] = useState(false);

  // Editing states
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ lesson: Lesson; sectionId: string } | null>(null);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'section' | 'lesson' | 'material';
    sectionId: string;
    lessonId?: string;
    materialId?: string;
  } | null>(null);

  // Form states
  const [sectionForm, setSectionForm] = useState<SectionFormData & { estimatedTime?: number }>({ 
    title: '', 
    description: '',
    estimatedTime: 0,
  });
  
  const [lessonForm, setLessonForm] = useState<LessonFormData>({
    title: '',
    description: '',
    type: 'video',
    content: {},
    duration: 0,
    isFree: false,
  });
  
  const [materialForm, setMaterialForm] = useState({
    title: '',
    type: 'pdf' as 'pdf' | 'video' | 'link' | 'file' | 'audio' | 'zip' | 'image',
    url: '',
    downloadable: true,
    fileSize: 0,
  });

  // File upload states
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const materialFileInputRef = useRef<HTMLInputElement>(null);

  // Draft/Auto-save states
  const [isDraftSaved, setIsDraftSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Quiz builder states
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  if (!course) return null;

  // Simulated file upload function
  const simulateFileUpload = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const uploadId = generateId();
      const newUpload: UploadingFile = {
        id: uploadId,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'uploading',
      };
      
      setUploadingFiles(prev => [...prev, newUpload]);

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          setUploadingFiles(prev => 
            prev.map(u => 
              u.id === uploadId 
                ? { ...u, progress: 100, status: 'processing' }
                : u
            )
          );

          // Simulate processing
          setTimeout(() => {
            const fakeUrl = URL.createObjectURL(file);
            setUploadingFiles(prev => 
              prev.map(u => 
                u.id === uploadId 
                  ? { ...u, status: 'complete', url: fakeUrl }
                  : u
              )
            );
            resolve(fakeUrl);
          }, 500);
        } else {
          setUploadingFiles(prev => 
            prev.map(u => 
              u.id === uploadId 
                ? { ...u, progress }
                : u
            )
          );
        }
      }, 200);
    });
  };

  // Handle file selection for lesson content
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'audio' | 'document' | 'image') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const url = await simulateFileUpload(file);
    
    if (type === 'video') {
      setLessonForm({
        ...lessonForm,
        content: { ...lessonForm.content, videoUrl: url, videoProvider: 'custom' }
      });
    } else if (type === 'audio') {
      setLessonForm({
        ...lessonForm,
        content: { ...lessonForm.content, audioUrl: url, audioTitle: file.name }
      });
    } else if (type === 'document') {
      setLessonForm({
        ...lessonForm,
        content: { ...lessonForm.content, documentUrl: url }
      });
    }
    
    // Auto-calculate duration for video/audio (simulated)
    if (type === 'video' || type === 'audio') {
      setLessonForm(prev => ({ ...prev, duration: Math.floor(Math.random() * 30) + 5 }));
    }

    setIsDraftSaved(false);
  };

  // Handle material file upload
  const handleMaterialFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const url = await simulateFileUpload(file);
    
    // Detect file type
    let type: typeof materialForm.type = 'file';
    if (file.type.includes('pdf')) type = 'pdf';
    else if (file.type.includes('video')) type = 'video';
    else if (file.type.includes('audio')) type = 'audio';
    else if (file.type.includes('image')) type = 'image';
    else if (file.type.includes('zip') || file.name.endsWith('.zip')) type = 'zip';

    setMaterialForm({
      ...materialForm,
      title: file.name.replace(/\.[^/.]+$/, ''),
      url,
      type,
      fileSize: file.size,
    });
  };

  // Save draft function
  const saveDraft = useCallback(() => {
    // In a real app, this would save to backend/localStorage
    setIsDraftSaved(true);
    setLastSaved(new Date());
  }, []);

  // Section handlers
  const openAddSection = () => {
    setEditingSection(null);
    setSectionForm({ title: '', description: '', estimatedTime: 0 });
    setSectionDialogOpen(true);
  };

  const openEditSection = (section: Section) => {
    setEditingSection(section);
    setSectionForm({ 
      title: section.title, 
      description: section.description,
      estimatedTime: section.lessons.reduce((acc, l) => acc + l.duration, 0),
    });
    setSectionDialogOpen(true);
  };

  const handleSaveSection = () => {
    if (!sectionForm.title.trim()) return;

    if (editingSection) {
      updateSection(courseId, editingSection.id, sectionForm);
    } else {
      addSection(courseId, sectionForm);
    }
    setSectionDialogOpen(false);
    setIsDraftSaved(false);
  };

  // Lesson handlers
  const openAddLesson = (sectionId: string) => {
    setEditingLesson(null);
    setCurrentSectionId(sectionId);
    setLessonForm({
      title: '',
      description: '',
      type: 'video',
      content: {},
      duration: 0,
      isFree: false,
    });
    setUploadingFiles([]);
    setLessonDialogOpen(true);
  };

  const openEditLesson = (lesson: Lesson, sectionId: string) => {
    setEditingLesson({ lesson, sectionId });
    setCurrentSectionId(sectionId);
    setLessonForm({
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      content: lesson.content,
      duration: lesson.duration,
      isFree: lesson.isFree,
    });
    setQuizQuestions(lesson.content.quizQuestions || []);
    setUploadingFiles([]);
    setLessonDialogOpen(true);
  };

  const handleSaveLesson = () => {
    if (!lessonForm.title.trim() || !currentSectionId) return;

    const lessonData = {
      ...lessonForm,
      content: {
        ...lessonForm.content,
        quizQuestions: quizQuestions.length > 0 ? quizQuestions : lessonForm.content.quizQuestions,
      },
    };

    if (editingLesson) {
      updateLesson(courseId, currentSectionId, editingLesson.lesson.id, lessonData);
    } else {
      addLesson(courseId, currentSectionId, lessonData);
    }
    setLessonDialogOpen(false);
    setIsDraftSaved(false);
    setQuizQuestions([]);
  };

  // Material handlers
  const openAddMaterial = (sectionId: string, lessonId: string) => {
    setCurrentSectionId(sectionId);
    setCurrentLessonId(lessonId);
    setMaterialForm({ title: '', type: 'pdf', url: '', downloadable: true, fileSize: 0 });
    setUploadingFiles([]);
    setMaterialDialogOpen(true);
  };

  const handleSaveMaterial = () => {
    if (!materialForm.title.trim() || !materialForm.url.trim() || !currentSectionId || !currentLessonId) return;
    addMaterial(courseId, currentSectionId, currentLessonId, {
      ...materialForm,
      fileSize: materialForm.fileSize,
    });
    setMaterialDialogOpen(false);
    setIsDraftSaved(false);
  };

  // Delete handlers
  const openDeleteDialog = (type: 'section' | 'lesson' | 'material', sectionId: string, lessonId?: string, materialId?: string) => {
    setDeleteTarget({ type, sectionId, lessonId, materialId });
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'section') {
      deleteSection(courseId, deleteTarget.sectionId);
    } else if (deleteTarget.type === 'lesson' && deleteTarget.lessonId) {
      deleteLesson(courseId, deleteTarget.sectionId, deleteTarget.lessonId);
    } else if (deleteTarget.type === 'material' && deleteTarget.lessonId && deleteTarget.materialId) {
      deleteMaterial(courseId, deleteTarget.sectionId, deleteTarget.lessonId, deleteTarget.materialId);
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    setIsDraftSaved(false);
  };

  // Quiz question handlers
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: generateId(),
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10,
      explanation: '',
    };
    setQuizQuestions([...quizQuestions, newQuestion]);
    setCurrentQuestionIndex(quizQuestions.length);
  };

  const updateQuestion = (index: number, data: Partial<QuizQuestion>) => {
    setQuizQuestions(prev => 
      prev.map((q, i) => i === index ? { ...q, ...data } : q)
    );
  };

  const deleteQuestion = (index: number) => {
    setQuizQuestions(prev => prev.filter((_, i) => i !== index));
    if (currentQuestionIndex >= quizQuestions.length - 1) {
      setCurrentQuestionIndex(Math.max(0, quizQuestions.length - 2));
    }
  };

  const duplicateQuestion = (index: number) => {
    const question = quizQuestions[index];
    const newQuestion = { ...question, id: generateId() };
    const newQuestions = [...quizQuestions];
    newQuestions.splice(index + 1, 0, newQuestion);
    setQuizQuestions(newQuestions);
  };

  // Calculate total stats
  const totalDuration = course.sections.reduce(
    (acc, section) => acc + section.lessons.reduce((lacc, l) => lacc + l.duration, 0),
    0
  );
  const totalLessons = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const totalMaterials = course.sections.reduce(
    (acc, s) => acc + s.lessons.reduce((lacc, l) => lacc + l.materials.length, 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Header with stats and save status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Course Curriculum</h2>
          <p className="text-sm text-muted-foreground">
            {course.sections.length} sections, {totalLessons} lessons, {formatDuration(totalDuration)} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Save status indicator */}
          <div className="flex items-center gap-2 text-sm">
            {isDraftSaved ? (
              <>
                <Cloud className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'All changes saved'}
                </span>
              </>
            ) : (
              <>
                <CloudOff className="h-4 w-4 text-amber-500" />
                <span className="text-amber-600">Unsaved changes</span>
              </>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={saveDraft} disabled={isDraftSaved}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={openAddSection}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FolderPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{course.sections.length}</p>
                <p className="text-xs text-muted-foreground">Sections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Video className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLessons}</p>
                <p className="text-xs text-muted-foreground">Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
                <p className="text-xs text-muted-foreground">Total Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Paperclip className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMaterials}</p>
                <p className="text-xs text-muted-foreground">Materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections List */}
      {course.sections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderPlus className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No sections yet</h3>
            <p className="mt-2 text-muted-foreground text-center">
              Start building your course by adding your first section
            </p>
            <Button className="mt-4" onClick={openAddSection}>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={course.sections.map(s => s.id)} className="space-y-4">
          {course.sections.map((section, sectionIndex) => (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg bg-card">
              <div className="flex items-center px-4 py-3 group">
                <AccordionTrigger className="flex-1 hover:no-underline p-0 [&>svg]:ml-auto">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Section {sectionIndex + 1}: {section.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {section.lessons.length} lessons
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatDuration(section.lessons.reduce((acc, l) => acc + l.duration, 0))}
                        </Badge>
                      </div>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{section.description}</p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditSection(section)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Section
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAddLesson(section.id)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Lesson
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={sectionIndex === 0}>
                      <MoveUp className="mr-2 h-4 w-4" />
                      Move Up
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={sectionIndex === course.sections.length - 1}>
                      <MoveDown className="mr-2 h-4 w-4" />
                      Move Down
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => openDeleteDialog('section', section.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Section
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  {section.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-1 cursor-grab" />
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {lessonTypeIcons[lesson.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {sectionIndex + 1}.{lessonIndex + 1} {lesson.title}
                          </span>
                          {lesson.isFree && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              Free Preview
                            </Badge>
                          )}
                          {(lesson.type === 'quiz' || lesson.type === 'exam') && lesson.content.quizQuestions && (
                            <Badge variant="outline" className="text-xs">
                              {lesson.content.quizQuestions.length} questions
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {lessonTypeLabels[lesson.type]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(lesson.duration)}
                          </span>
                          {lesson.materials.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {lesson.materials.length} materials
                            </span>
                          )}
                        </div>
                        {/* Materials list */}
                        {lesson.materials.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {lesson.materials.map((material) => (
                              <div
                                key={material.id}
                                className="flex items-center gap-2 text-xs text-muted-foreground pl-2 border-l-2"
                              >
                                {fileTypeIcons[material.type] || fileTypeIcons.file}
                                <span className="flex-1 truncate">{material.title}</span>
                                <span className="uppercase text-xs bg-muted px-1 rounded">{material.type}</span>
                                {material.fileSize && (
                                  <span>{formatFileSize(material.fileSize)}</span>
                                )}
                                <button
                                  onClick={() => openDeleteDialog('material', section.id, lesson.id, material.id)}
                                  className="text-destructive hover:text-destructive/80"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditLesson(lesson, section.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Lesson
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAddMaterial(section.id, lesson.id)}>
                            <Paperclip className="mr-2 h-4 w-4" />
                            Add Material
                          </DropdownMenuItem>
                          {(lesson.type === 'quiz' || lesson.type === 'exam') && (
                            <DropdownMenuItem onClick={() => {
                              setEditingLesson({ lesson, sectionId: section.id });
                              setQuizQuestions(lesson.content.quizQuestions || []);
                              setQuizBuilderOpen(true);
                            }}>
                              <HelpCircle className="mr-2 h-4 w-4" />
                              Edit Questions
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={lessonIndex === 0}>
                            <MoveUp className="mr-2 h-4 w-4" />
                            Move Up
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={lessonIndex === section.lessons.length - 1}>
                            <MoveDown className="mr-2 h-4 w-4" />
                            Move Down
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => openDeleteDialog('lesson', section.id, lesson.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Lesson
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => openAddLesson(section.id)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Lesson
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
            <DialogDescription>
              {editingSection ? 'Update the section details' : 'Create a new section for your course'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sectionTitle">Section Title *</Label>
              <Input
                id="sectionTitle"
                placeholder="e.g., Introduction to Web Development"
                value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionDescription">Description</Label>
              <Textarea
                id="sectionDescription"
                placeholder="Brief description of this section"
                value={sectionForm.description}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Estimated Duration (minutes)</Label>
              <Input
                id="estimatedTime"
                type="number"
                min="0"
                placeholder="30"
                value={sectionForm.estimatedTime || ''}
                onChange={(e) => setSectionForm({ ...sectionForm, estimatedTime: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Set the expected time to complete this section (lessons will auto-calculate)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSection}>{editingSection ? 'Save Changes' : 'Add Section'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog with Tabs */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
            <DialogDescription>
              {editingLesson ? 'Update the lesson details and content' : 'Create a new lesson with content and materials'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              {(lessonForm.type === 'quiz' || lessonForm.type === 'exam') && (
                <TabsTrigger value="questions">Questions</TabsTrigger>
              )}
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lessonTitle">Lesson Title *</Label>
                  <Input
                    id="lessonTitle"
                    placeholder="e.g., Welcome to the Course"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lesson Type *</Label>
                  <Select
                    value={lessonForm.type}
                    onValueChange={(value) => setLessonForm({ ...lessonForm, type: value as LessonType, content: {} })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Video Lesson
                        </div>
                      </SelectItem>
                      <SelectItem value="audio">
                        <div className="flex items-center gap-2">
                          <Headphones className="h-4 w-4" />
                          Audio Lesson
                        </div>
                      </SelectItem>
                      <SelectItem value="document">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Document / Article
                        </div>
                      </SelectItem>
                      <SelectItem value="slideshow">
                        <div className="flex items-center gap-2">
                          <Images className="h-4 w-4" />
                          Slideshow
                        </div>
                      </SelectItem>
                      <SelectItem value="quiz">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Quiz
                        </div>
                      </SelectItem>
                      <SelectItem value="exam">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Exam
                        </div>
                      </SelectItem>
                      <SelectItem value="assignment">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          Assignment
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessonDescription">Description</Label>
                <Textarea
                  id="lessonDescription"
                  placeholder="Brief description of this lesson"
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    id="isFree"
                    checked={lessonForm.isFree}
                    onCheckedChange={(checked) => setLessonForm({ ...lessonForm, isFree: checked })}
                  />
                  <Label htmlFor="isFree">Free Preview</Label>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    id="autoSave"
                    checked={autoSaveEnabled}
                    onCheckedChange={setAutoSaveEnabled}
                  />
                  <Label htmlFor="autoSave">Auto-save</Label>
                </div>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-4">
              {/* Video upload */}
              {lessonForm.type === 'video' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileSelect(e, 'video')}
                      accept="video/*"
                      className="hidden"
                    />
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <h4 className="mt-2 font-medium">Upload Video File</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drag & drop or click to upload. MP4, WebM, MOV supported.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or paste URL</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">Video URL</Label>
                    <Input
                      id="videoUrl"
                      placeholder="https://www.youtube.com/embed/..."
                      value={lessonForm.content.videoUrl || ''}
                      onChange={(e) => setLessonForm({
                        ...lessonForm,
                        content: { ...lessonForm.content, videoUrl: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Video Provider</Label>
                    <Select
                      value={lessonForm.content.videoProvider || 'youtube'}
                      onValueChange={(value) => setLessonForm({
                        ...lessonForm,
                        content: { ...lessonForm.content, videoProvider: value as 'youtube' | 'vimeo' | 'custom' }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="vimeo">Vimeo</SelectItem>
                        <SelectItem value="custom">Custom / Uploaded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Audio upload */}
              {lessonForm.type === 'audio' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileSelect(e, 'audio')}
                      accept="audio/*"
                      className="hidden"
                    />
                    <Headphones className="h-10 w-10 mx-auto text-muted-foreground" />
                    <h4 className="mt-2 font-medium">Upload Audio File</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      MP3, WAV, OGG, M4A supported. Max 500MB.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="audioUrl">Or Audio URL</Label>
                    <Input
                      id="audioUrl"
                      placeholder="https://example.com/audio.mp3"
                      value={lessonForm.content.audioUrl || ''}
                      onChange={(e) => setLessonForm({
                        ...lessonForm,
                        content: { ...lessonForm.content, audioUrl: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audioTitle">Audio Title</Label>
                    <Input
                      id="audioTitle"
                      placeholder="e.g., Lesson 1 Audio"
                      value={lessonForm.content.audioTitle || ''}
                      onChange={(e) => setLessonForm({
                        ...lessonForm,
                        content: { ...lessonForm.content, audioTitle: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audioTranscript">Transcript (Optional)</Label>
                    <Textarea
                      id="audioTranscript"
                      placeholder="Enter the audio transcript for accessibility..."
                      value={lessonForm.content.audioTranscript || ''}
                      onChange={(e) => setLessonForm({
                        ...lessonForm,
                        content: { ...lessonForm.content, audioTranscript: e.target.value }
                      })}
                      rows={6}
                    />
                  </div>
                </div>
              )}

              {/* Document */}
              {lessonForm.type === 'document' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentContent">Document Content (Markdown supported)</Label>
                    <Textarea
                      id="documentContent"
                      placeholder="Write your lesson content here using Markdown..."
                      value={lessonForm.content.documentContent || ''}
                      onChange={(e) => setLessonForm({
                        ...lessonForm,
                        content: { ...lessonForm.content, documentContent: e.target.value }
                      })}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileSelect(e, 'document')}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground">
                      Or upload a PDF/DOC file
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                  </div>
                </div>
              )}

              {/* Slideshow */}
              {lessonForm.type === 'slideshow' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Images className="h-10 w-10 mx-auto text-muted-foreground" />
                    <h4 className="mt-2 font-medium">Upload Slide Images</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload multiple images to create a slideshow. PNG, JPG, WebP supported.
                    </p>
                    <Button variant="outline" className="mt-4">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Images
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="autoPlay"
                        checked={lessonForm.content.autoPlay || false}
                        onCheckedChange={(checked) => setLessonForm({
                          ...lessonForm,
                          content: { ...lessonForm.content, autoPlay: checked }
                        })}
                      />
                      <Label htmlFor="autoPlay">Auto-play slides</Label>
                    </div>
                    {lessonForm.content.autoPlay && (
                      <div className="space-y-2">
                        <Label htmlFor="slideDuration">Slide Duration (seconds)</Label>
                        <Input
                          id="slideDuration"
                          type="number"
                          min="1"
                          max="60"
                          value={lessonForm.content.slideDuration || 5}
                          onChange={(e) => setLessonForm({
                            ...lessonForm,
                            content: { ...lessonForm.content, slideDuration: parseInt(e.target.value) || 5 }
                          })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quiz/Exam Settings */}
              {(lessonForm.type === 'quiz' || lessonForm.type === 'exam') && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Assessment Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Timer className="h-4 w-4" />
                            Time Limit (min)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0 = no limit"
                            value={lessonForm.content.assessmentConfig?.timeLimit || ''}
                            onChange={(e) => setLessonForm({
                              ...lessonForm,
                              content: {
                                ...lessonForm.content,
                                assessmentConfig: {
                                  type: lessonForm.type as 'quiz' | 'exam',
                                  title: lessonForm.title,
                                  passingScore: lessonForm.content.assessmentConfig?.passingScore || 70,
                                  maxAttempts: lessonForm.content.assessmentConfig?.maxAttempts || 3,
                                  shuffleQuestions: lessonForm.content.assessmentConfig?.shuffleQuestions || false,
                                  shuffleOptions: lessonForm.content.assessmentConfig?.shuffleOptions || false,
                                  showResults: lessonForm.content.assessmentConfig?.showResults || 'after_submission',
                                  allowReview: lessonForm.content.assessmentConfig?.allowReview || true,
                                  certificateOnPass: lessonForm.content.assessmentConfig?.certificateOnPass || true,
                                  timeLimit: parseInt(e.target.value) || 0,
                                }
                              }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Passing Score (%)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={lessonForm.content.assessmentConfig?.passingScore || 70}
                            onChange={(e) => setLessonForm({
                              ...lessonForm,
                              content: {
                                ...lessonForm.content,
                                assessmentConfig: {
                                  ...lessonForm.content.assessmentConfig,
                                  type: lessonForm.type as 'quiz' | 'exam',
                                  title: lessonForm.title,
                                  passingScore: parseInt(e.target.value) || 70,
                                  maxAttempts: lessonForm.content.assessmentConfig?.maxAttempts || 3,
                                  shuffleQuestions: lessonForm.content.assessmentConfig?.shuffleQuestions || false,
                                  shuffleOptions: lessonForm.content.assessmentConfig?.shuffleOptions || false,
                                  showResults: lessonForm.content.assessmentConfig?.showResults || 'after_submission',
                                  allowReview: lessonForm.content.assessmentConfig?.allowReview || true,
                                  certificateOnPass: lessonForm.content.assessmentConfig?.certificateOnPass || true,
                                  timeLimit: lessonForm.content.assessmentConfig?.timeLimit || 0,
                                }
                              }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Attempts</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0 = unlimited"
                            value={lessonForm.content.assessmentConfig?.maxAttempts || 3}
                            onChange={(e) => setLessonForm({
                              ...lessonForm,
                              content: {
                                ...lessonForm.content,
                                assessmentConfig: {
                                  ...lessonForm.content.assessmentConfig,
                                  type: lessonForm.type as 'quiz' | 'exam',
                                  title: lessonForm.title,
                                  passingScore: lessonForm.content.assessmentConfig?.passingScore || 70,
                                  maxAttempts: parseInt(e.target.value) || 0,
                                  shuffleQuestions: lessonForm.content.assessmentConfig?.shuffleQuestions || false,
                                  shuffleOptions: lessonForm.content.assessmentConfig?.shuffleOptions || false,
                                  showResults: lessonForm.content.assessmentConfig?.showResults || 'after_submission',
                                  allowReview: lessonForm.content.assessmentConfig?.allowReview || true,
                                  certificateOnPass: lessonForm.content.assessmentConfig?.certificateOnPass || true,
                                  timeLimit: lessonForm.content.assessmentConfig?.timeLimit || 0,
                                }
                              }
                            })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-3">
                          <Switch
                            id="shuffleQuestions"
                            checked={lessonForm.content.assessmentConfig?.shuffleQuestions || false}
                            onCheckedChange={(checked) => setLessonForm({
                              ...lessonForm,
                              content: {
                                ...lessonForm.content,
                                assessmentConfig: {
                                  ...lessonForm.content.assessmentConfig,
                                  type: lessonForm.type as 'quiz' | 'exam',
                                  title: lessonForm.title,
                                  passingScore: lessonForm.content.assessmentConfig?.passingScore || 70,
                                  maxAttempts: lessonForm.content.assessmentConfig?.maxAttempts || 3,
                                  shuffleQuestions: checked,
                                  shuffleOptions: lessonForm.content.assessmentConfig?.shuffleOptions || false,
                                  showResults: lessonForm.content.assessmentConfig?.showResults || 'after_submission',
                                  allowReview: lessonForm.content.assessmentConfig?.allowReview || true,
                                  certificateOnPass: lessonForm.content.assessmentConfig?.certificateOnPass || true,
                                  timeLimit: lessonForm.content.assessmentConfig?.timeLimit || 0,
                                }
                              }
                            })}
                          />
                          <Label htmlFor="shuffleQuestions" className="flex items-center gap-2">
                            <Shuffle className="h-4 w-4" />
                            Shuffle Questions
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            id="shuffleOptions"
                            checked={lessonForm.content.assessmentConfig?.shuffleOptions || false}
                            onCheckedChange={(checked) => setLessonForm({
                              ...lessonForm,
                              content: {
                                ...lessonForm.content,
                                assessmentConfig: {
                                  ...lessonForm.content.assessmentConfig,
                                  type: lessonForm.type as 'quiz' | 'exam',
                                  title: lessonForm.title,
                                  passingScore: lessonForm.content.assessmentConfig?.passingScore || 70,
                                  maxAttempts: lessonForm.content.assessmentConfig?.maxAttempts || 3,
                                  shuffleQuestions: lessonForm.content.assessmentConfig?.shuffleQuestions || false,
                                  shuffleOptions: checked,
                                  showResults: lessonForm.content.assessmentConfig?.showResults || 'after_submission',
                                  allowReview: lessonForm.content.assessmentConfig?.allowReview || true,
                                  certificateOnPass: lessonForm.content.assessmentConfig?.certificateOnPass || true,
                                  timeLimit: lessonForm.content.assessmentConfig?.timeLimit || 0,
                                }
                              }
                            })}
                          />
                          <Label htmlFor="shuffleOptions" className="flex items-center gap-2">
                            <Shuffle className="h-4 w-4" />
                            Shuffle Options
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            id="allowReview"
                            checked={lessonForm.content.assessmentConfig?.allowReview !== false}
                            onCheckedChange={(checked) => setLessonForm({
                              ...lessonForm,
                              content: {
                                ...lessonForm.content,
                                assessmentConfig: {
                                  ...lessonForm.content.assessmentConfig,
                                  type: lessonForm.type as 'quiz' | 'exam',
                                  title: lessonForm.title,
                                  passingScore: lessonForm.content.assessmentConfig?.passingScore || 70,
                                  maxAttempts: lessonForm.content.assessmentConfig?.maxAttempts || 3,
                                  shuffleQuestions: lessonForm.content.assessmentConfig?.shuffleQuestions || false,
                                  shuffleOptions: lessonForm.content.assessmentConfig?.shuffleOptions || false,
                                  showResults: lessonForm.content.assessmentConfig?.showResults || 'after_submission',
                                  allowReview: checked,
                                  certificateOnPass: lessonForm.content.assessmentConfig?.certificateOnPass || true,
                                  timeLimit: lessonForm.content.assessmentConfig?.timeLimit || 0,
                                }
                              }
                            })}
                          />
                          <Label htmlFor="allowReview" className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Allow Review After
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            id="certificateOnPass"
                            checked={lessonForm.content.assessmentConfig?.certificateOnPass !== false}
                            onCheckedChange={(checked) => setLessonForm({
                              ...lessonForm,
                              content: {
                                ...lessonForm.content,
                                assessmentConfig: {
                                  ...lessonForm.content.assessmentConfig,
                                  type: lessonForm.type as 'quiz' | 'exam',
                                  title: lessonForm.title,
                                  passingScore: lessonForm.content.assessmentConfig?.passingScore || 70,
                                  maxAttempts: lessonForm.content.assessmentConfig?.maxAttempts || 3,
                                  shuffleQuestions: lessonForm.content.assessmentConfig?.shuffleQuestions || false,
                                  shuffleOptions: lessonForm.content.assessmentConfig?.shuffleOptions || false,
                                  showResults: lessonForm.content.assessmentConfig?.showResults || 'after_submission',
                                  allowReview: lessonForm.content.assessmentConfig?.allowReview || true,
                                  certificateOnPass: checked,
                                  timeLimit: lessonForm.content.assessmentConfig?.timeLimit || 0,
                                }
                              }
                            })}
                          />
                          <Label htmlFor="certificateOnPass" className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Certificate on 100%
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Questions ({quizQuestions.length})
                        </CardTitle>
                        <Button size="sm" onClick={addQuestion}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Question
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {quizQuestions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                          <p>No questions added yet</p>
                          <Button variant="outline" size="sm" className="mt-3" onClick={addQuestion}>
                            Add First Question
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {quizQuestions.map((q, idx) => (
                            <div 
                              key={q.id} 
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer",
                                currentQuestionIndex === idx ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                              )}
                              onClick={() => setCurrentQuestionIndex(idx)}
                            >
                              <span className="font-medium text-sm w-6">{idx + 1}.</span>
                              <div className="flex-1 truncate">
                                <p className="text-sm truncate">{q.question || 'Untitled question'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {q.type === 'multiple_choice' ? 'Multiple Choice' : q.type === 'true_false' ? 'True/False' : q.type} • {q.points} pts
                                </p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => duplicateQuestion(idx)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => deleteQuestion(idx)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Assignment */}
              {lessonForm.type === 'assignment' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignmentDescription">Assignment Instructions</Label>
                    <Textarea
                      id="assignmentDescription"
                      placeholder="Describe the assignment requirements, submission guidelines, and grading criteria..."
                      value={lessonForm.content.assignmentDescription || ''}
                      onChange={(e) => setLessonForm({
                        ...lessonForm,
                        content: { ...lessonForm.content, assignmentDescription: e.target.value }
                      })}
                      rows={8}
                    />
                  </div>
                </div>
              )}

              {/* Upload progress indicator */}
              {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploading Files</Label>
                  {uploadingFiles.map(file => (
                    <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      {file.status === 'complete' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : file.status === 'error' ? (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={file.progress} className="flex-1 h-1" />
                          <span className="text-xs text-muted-foreground">{Math.round(file.progress)}%</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Questions Tab (for Quiz/Exam) */}
            {(lessonForm.type === 'quiz' || lessonForm.type === 'exam') && (
              <TabsContent value="questions" className="space-y-4 mt-4">
                {quizQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Questions Yet</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                      Add questions to your {lessonForm.type}
                    </p>
                    <Button onClick={addQuestion}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Question Navigation */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {quizQuestions.map((_, idx) => (
                        <Button
                          key={idx}
                          variant={currentQuestionIndex === idx ? "default" : "outline"}
                          size="sm"
                          className="min-w-[40px]"
                          onClick={() => setCurrentQuestionIndex(idx)}
                        >
                          {idx + 1}
                        </Button>
                      ))}
                      <Button variant="ghost" size="sm" onClick={addQuestion}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Current Question Editor */}
                    {quizQuestions[currentQuestionIndex] && (
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Question {currentQuestionIndex + 1}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Select
                                value={quizQuestions[currentQuestionIndex].type}
                                onValueChange={(value) => updateQuestion(currentQuestionIndex, { 
                                  type: value as QuestionType,
                                  options: value === 'true_false' ? ['True', 'False'] : ['', '', '', ''],
                                  correctAnswer: 0,
                                })}
                              >
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                  <SelectItem value="true_false">True / False</SelectItem>
                                  <SelectItem value="short_answer">Short Answer</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" onClick={() => deleteQuestion(currentQuestionIndex)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Question Text</Label>
                            <Textarea
                              placeholder="Enter your question..."
                              value={quizQuestions[currentQuestionIndex].question}
                              onChange={(e) => updateQuestion(currentQuestionIndex, { question: e.target.value })}
                              rows={2}
                            />
                          </div>

                          {(quizQuestions[currentQuestionIndex].type === 'multiple_choice' || 
                            quizQuestions[currentQuestionIndex].type === 'true_false') && (
                            <div className="space-y-2">
                              <Label>Options (click to set correct answer)</Label>
                              {quizQuestions[currentQuestionIndex].options.map((option, optIdx) => (
                                <div 
                                  key={optIdx}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                    quizQuestions[currentQuestionIndex].correctAnswer === optIdx 
                                      ? "border-green-500 bg-green-50" 
                                      : "hover:bg-muted/50"
                                  )}
                                  onClick={() => updateQuestion(currentQuestionIndex, { correctAnswer: optIdx })}
                                >
                                  <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                    quizQuestions[currentQuestionIndex].correctAnswer === optIdx 
                                      ? "border-green-500 bg-green-500" 
                                      : "border-muted-foreground"
                                  )}>
                                    {quizQuestions[currentQuestionIndex].correctAnswer === optIdx && (
                                      <CheckCircle2 className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...quizQuestions[currentQuestionIndex].options];
                                      newOptions[optIdx] = e.target.value;
                                      updateQuestion(currentQuestionIndex, { options: newOptions });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder={`Option ${optIdx + 1}`}
                                    className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                                    disabled={quizQuestions[currentQuestionIndex].type === 'true_false'}
                                  />
                                </div>
                              ))}
                              {quizQuestions[currentQuestionIndex].type === 'multiple_choice' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => {
                                    const newOptions = [...quizQuestions[currentQuestionIndex].options, ''];
                                    updateQuestion(currentQuestionIndex, { options: newOptions });
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Option
                                </Button>
                              )}
                            </div>
                          )}

                          {quizQuestions[currentQuestionIndex].type === 'short_answer' && (
                            <div className="space-y-2">
                              <Label>Correct Answer</Label>
                              <Input
                                placeholder="Enter the correct answer..."
                                value={quizQuestions[currentQuestionIndex].correctAnswer as string || ''}
                                onChange={(e) => updateQuestion(currentQuestionIndex, { correctAnswer: e.target.value })}
                              />
                            </div>
                          )}

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Points</Label>
                              <Input
                                type="number"
                                min="1"
                                value={quizQuestions[currentQuestionIndex].points}
                                onChange={(e) => updateQuestion(currentQuestionIndex, { points: parseInt(e.target.value) || 10 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Explanation (shown after answer)</Label>
                              <Input
                                placeholder="Why this is the correct answer..."
                                value={quizQuestions[currentQuestionIndex].explanation || ''}
                                onChange={(e) => updateQuestion(currentQuestionIndex, { explanation: e.target.value })}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => { handleSaveLesson(); setIsDraftSaved(true); }}>
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button onClick={handleSaveLesson}>
              {editingLesson ? 'Save Changes' : 'Add Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Material / Attachment</DialogTitle>
            <DialogDescription>
              Add downloadable resources like PDFs, source code, or supplementary files
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* File upload area */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                ref={materialFileInputRef}
                onChange={handleMaterialFileSelect}
                className="hidden"
              />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
              <h4 className="mt-2 font-medium">Upload File</h4>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, ZIP, Images, Audio, Video - Max 100MB
              </p>
              <Button variant="outline" className="mt-4" onClick={() => materialFileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            </div>

            {/* Upload progress */}
            {uploadingFiles.length > 0 && (
              <div className="space-y-2">
                {uploadingFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    {file.status === 'complete' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <Progress value={file.progress} className="h-1 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or enter URL</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialTitle">Title *</Label>
              <Input
                id="materialTitle"
                placeholder="e.g., Course Slides PDF"
                value={materialForm.title}
                onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={materialForm.type}
                  onValueChange={(value) => setMaterialForm({ ...materialForm, type: value as typeof materialForm.type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-500" />
                        PDF Document
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <FileVideo className="h-4 w-4 text-blue-500" />
                        Video File
                      </div>
                    </SelectItem>
                    <SelectItem value="audio">
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4 text-purple-500" />
                        Audio File
                      </div>
                    </SelectItem>
                    <SelectItem value="image">
                      <div className="flex items-center gap-2">
                        <FileImage className="h-4 w-4 text-green-500" />
                        Image
                      </div>
                    </SelectItem>
                    <SelectItem value="zip">
                      <div className="flex items-center gap-2">
                        <FileArchive className="h-4 w-4 text-amber-500" />
                        ZIP Archive
                      </div>
                    </SelectItem>
                    <SelectItem value="link">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        External Link
                      </div>
                    </SelectItem>
                    <SelectItem value="file">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4" />
                        Other File
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="downloadable"
                  checked={materialForm.downloadable}
                  onCheckedChange={(checked) => setMaterialForm({ ...materialForm, downloadable: checked })}
                />
                <Label htmlFor="downloadable">Allow Download</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialUrl">File URL</Label>
              <Input
                id="materialUrl"
                placeholder="https://example.com/file.pdf"
                value={materialForm.url}
                onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMaterial} disabled={!materialForm.title || !materialForm.url}>
              Add Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'section'
                ? 'This will permanently delete the section and all its lessons. This action cannot be undone.'
                : deleteTarget?.type === 'lesson'
                ? 'This will permanently delete this lesson and all its materials. This action cannot be undone.'
                : 'This will permanently delete this material. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
