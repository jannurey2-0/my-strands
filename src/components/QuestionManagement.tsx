import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit2, BookOpen, Award, Zap, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface AptitudeQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  category: string;
  difficulty_level: number;
  type?: 'multiple_choice' | 'true_false' | 'essay' | 'identification';
}

interface QuestionManagementProps {
  questions: AptitudeQuestion[];
  onRefresh: () => void;
}

export default function QuestionManagement({ questions, onRefresh }: QuestionManagementProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AptitudeQuestion | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_answer: 0,
    category: '',
    difficulty_level: 1,
    type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'essay' | 'identification'
  });

  const resetForm = () => {
    setFormData({
      question: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correct_answer: 0,
      category: '',
      difficulty_level: 1,
      type: 'multiple_choice'
    });
    setEditingQuestion(null);
    setShowForm(false);
  };

  const handleEdit = (question: AptitudeQuestion) => {
    setFormData({
      question: question.question,
      option1: question.options[0] || '',
      option2: question.options[1] || '',
      option3: question.options[2] || '',
      option4: question.options[3] || '',
      correct_answer: question.correct_answer,
      category: question.category,
      difficulty_level: question.difficulty_level,
      type: question.type || 'multiple_choice'
    });
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build options depending on question type
    let options: string[] = [];
    if (formData.type === 'multiple_choice') {
      options = [formData.option1, formData.option2, formData.option3, formData.option4];
    } else if (formData.type === 'true_false') {
      options = ['True', 'False'];
    } else {
      options = []; // essay and identification don't have options
    }
    
    try {
      const questionData = {
        question: formData.question,
        options: JSON.stringify(options),
        correct_answer: formData.correct_answer,
        category: formData.category,
        difficulty_level: formData.difficulty_level,
        type: formData.type
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from('aptitude_questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Question updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('aptitude_questions')
          .insert([questionData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Question created successfully"
        });
      }

      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('aptitude_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully"
      });

      onRefresh();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    } finally {
      setQuestionToDelete(null);
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const questionsToInsert = results.data
              .filter((row: any) => row.question && row.question.trim() !== '')
              .map((row: any) => {
                // Build options array based on question type
                let options: string[] = [];
                if (row.type === 'true_false') {
                  options = ['True', 'False'];
                } else if (row.type === 'multiple_choice') {
                  options = [row.option1, row.option2, row.option3, row.option4].filter(opt => opt);
                }
                
                return {
                  question: row.question,
                  options: JSON.stringify(options),
                  correct_answer: parseInt(row.correct_answer) || 0,
                  category: row.category || 'math',
                  difficulty_level: parseInt(row.difficulty_level) || 1,
                  type: row.type || 'multiple_choice'
                };
              });

            if (questionsToInsert.length === 0) {
              toast({
                title: "No Valid Questions",
                description: "No valid questions found in the CSV file.",
                variant: "destructive"
              });
              return;
            }

            // Insert questions in batches to avoid timeout issues
            const batchSize = 50;
            for (let i = 0; i < questionsToInsert.length; i += batchSize) {
              const batch = questionsToInsert.slice(i, i + batchSize);
              const { error } = await supabase
                .from('aptitude_questions')
                .insert(batch);

              if (error) throw error;
            }

            toast({
              title: "Success",
              description: `Successfully imported ${questionsToInsert.length} questions!`
            });

            onRefresh();
          } catch (error) {
            console.error('Error importing questions:', error);
            toast({
              title: "Error",
              description: "Failed to import questions. Please check the CSV format and try again.",
              variant: "destructive"
            });
          } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          toast({
            title: "Error",
            description: "Failed to parse CSV file. Please check the format and try again.",
            variant: "destructive"
          });
          setIsImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      });
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Error",
        description: "Failed to import CSV file.",
        variant: "destructive"
      });
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getDifficultyIcon = (level: number) => {
    switch (level) {
      case 1: return <span className="text-green-500">●</span>;
      case 2: return <span className="text-yellow-500">●●</span>;
      case 3: return <span className="text-red-500">●●●</span>;
      default: return <span>●</span>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'math': return <Award className="h-4 w-4 text-blue-500" />;
      case 'science': return <Zap className="h-4 w-4 text-green-500" />;
      case 'language': return <BookOpen className="h-4 w-4 text-purple-500" />;
      case 'logical': return <span className="font-bold text-orange-500">L</span>;
      default: return <span>?</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Question Management</h2>
          <p className="text-muted-foreground">Create and manage assessment questions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImporting}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportCSV}
        accept=".csv"
        className="hidden"
      />

      {/* CSV Import Instructions */}
      <Card className="border-dashed border-muted">
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Tip:</strong> Import multiple questions at once using a CSV file. 
              <a href="/sample-questions.csv" className="text-primary hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                Download sample CSV
              </a>
            </p>
            <p>
              CSV format: question, option1, option2, option3, option4, correct_answer, category, difficulty_level, type
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the question and remove it from the assessment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => questionToDelete && handleDelete(questionToDelete)}>
              Delete Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Question Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden" aria-describedby="question-dialog-description">
          <Card className="border-primary/20 shadow-lg max-h-[80vh]">
            <CardHeader>
              <CardTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</CardTitle>
              <CardDescription id="question-dialog-description">
                {editingQuestion 
                  ? 'Update the details of the existing question' 
                  : 'Create a new assessment question for students'}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[60vh]">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    required
                    placeholder="Enter the question text..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Question Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True / False</SelectItem>
                        <SelectItem value="essay">Essay</SelectItem>
                        <SelectItem value="identification">Identification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="math">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-blue-500" />
                            Math
                          </div>
                        </SelectItem>
                        <SelectItem value="science">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-green-500" />
                            Science
                          </div>
                        </SelectItem>
                        <SelectItem value="language">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-purple-500" />
                            Language
                          </div>
                        </SelectItem>
                        <SelectItem value="logical">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-orange-500">L</span>
                            Logical
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Options area: only show for multiple choice or true/false */}
                {(formData.type === 'multiple_choice' || formData.type === 'true_false') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Multiple choice: four option inputs. True/False: show two disabled inputs or preset */}
                    {formData.type === 'multiple_choice' ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="option1">Option 1</Label>
                          <Input
                            id="option1"
                            value={formData.option1}
                            onChange={(e) => setFormData({ ...formData, option1: e.target.value })}
                            required
                            placeholder="First option..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="option2">Option 2</Label>
                          <Input
                            id="option2"
                            value={formData.option2}
                            onChange={(e) => setFormData({ ...formData, option2: e.target.value })}
                            required
                            placeholder="Second option..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="option3">Option 3</Label>
                          <Input
                            id="option3"
                            value={formData.option3}
                            onChange={(e) => setFormData({ ...formData, option3: e.target.value })}
                            required
                            placeholder="Third option..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="option4">Option 4</Label>
                          <Input
                            id="option4"
                            value={formData.option4}
                            onChange={(e) => setFormData({ ...formData, option4: e.target.value })}
                            required
                            placeholder="Fourth option..."
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Option A</Label>
                          <Input value="True" disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>Option B</Label>
                          <Input value="False" disabled />
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="correct_answer">Correct Answer</Label>
                    <Select value={formData.correct_answer.toString()} onValueChange={(value) => setFormData({ ...formData, correct_answer: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct option" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.type === 'multiple_choice' ? (
                          <>
                            <SelectItem value="0">Option 1</SelectItem>
                            <SelectItem value="1">Option 2</SelectItem>
                            <SelectItem value="2">Option 3</SelectItem>
                            <SelectItem value="3">Option 4</SelectItem>
                          </>
                        ) : formData.type === 'true_false' ? (
                          <>
                            <SelectItem value="0">True</SelectItem>
                            <SelectItem value="1">False</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="0">N/A</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={formData.difficulty_level.toString()} onValueChange={(value) => setFormData({ ...formData, difficulty_level: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">●</span>
                            Easy
                          </div>
                        </SelectItem>
                        <SelectItem value="2">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500">●●</span>
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center gap-2">
                            <span className="text-red-500">●●●</span>
                            Hard
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingQuestion ? 'Update Question' : 'Add Question'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { resetForm(); setShowForm(false); }} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id} className="hover:shadow-md transition-all duration-200 border-muted/30">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="mt-1 text-muted-foreground">
                      {getCategoryIcon(question.category)}
                    </div>
                    <h3 className="font-medium text-foreground">{question.question}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                    {question.options.map((option, optionIndex) => (
                      <div 
                        key={optionIndex} 
                        className={`p-3 rounded-lg border ${
                          optionIndex === question.correct_answer 
                            ? 'bg-primary/10 border-primary/30 text-primary font-medium' 
                            : 'bg-muted/50 border-muted text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            optionIndex === question.correct_answer 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {optionIndex + 1}
                          </span>
                          <span>{option}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium capitalize">{question.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full">
                      <span className="text-muted-foreground">Difficulty:</span>
                      <span className="font-medium flex items-center gap-1">
                        {getDifficultyIcon(question.difficulty_level)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(question)}
                    className="h-9 px-3"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setQuestionToDelete(question.id)}
                    className="h-9 px-3"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {questions.length === 0 && (
          <Card className="border-dashed border-muted">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Questions Found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first assessment question.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}