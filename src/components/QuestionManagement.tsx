import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AptitudeQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  category: string;
  difficulty_level: number;
}

interface QuestionManagementProps {
  questions: AptitudeQuestion[];
  onRefresh: () => void;
}

export default function QuestionManagement({ questions, onRefresh }: QuestionManagementProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AptitudeQuestion | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_answer: 0,
    category: '',
    difficulty_level: 1
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
      difficulty_level: 1
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
      difficulty_level: question.difficulty_level
    });
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const options = [formData.option1, formData.option2, formData.option3, formData.option4];
    
    try {
      const questionData = {
        question: formData.question,
        options: JSON.stringify(options),
        correct_answer: formData.correct_answer,
        category: formData.category,
        difficulty_level: formData.difficulty_level
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
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Question Management</h2>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Question
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="option1">Option 1</Label>
                  <Input
                    id="option1"
                    value={formData.option1}
                    onChange={(e) => setFormData({ ...formData, option1: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="option2">Option 2</Label>
                  <Input
                    id="option2"
                    value={formData.option2}
                    onChange={(e) => setFormData({ ...formData, option2: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="option3">Option 3</Label>
                  <Input
                    id="option3"
                    value={formData.option3}
                    onChange={(e) => setFormData({ ...formData, option3: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="option4">Option 4</Label>
                  <Input
                    id="option4"
                    value={formData.option4}
                    onChange={(e) => setFormData({ ...formData, option4: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="correct_answer">Correct Answer</Label>
                  <Select value={formData.correct_answer.toString()} onValueChange={(value) => setFormData({ ...formData, correct_answer: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Option 1</SelectItem>
                      <SelectItem value="1">Option 2</SelectItem>
                      <SelectItem value="2">Option 3</SelectItem>
                      <SelectItem value="3">Option 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="math">Math</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="language">Language</SelectItem>
                      <SelectItem value="logical">Logical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty_level.toString()} onValueChange={(value) => setFormData({ ...formData, difficulty_level: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Easy</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium mb-2">{question.question}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className={`p-2 rounded ${optionIndex === question.correct_answer ? 'bg-primary/10 text-primary font-medium' : 'bg-muted'}`}>
                        {optionIndex + 1}. {option}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Category: {question.category}</span>
                    <span>Difficulty: {question.difficulty_level === 1 ? 'Easy' : question.difficulty_level === 2 ? 'Medium' : 'Hard'}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(question)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(question.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {questions.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No questions created yet. Click "Add Question" to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}