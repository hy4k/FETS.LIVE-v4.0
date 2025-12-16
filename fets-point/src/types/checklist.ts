export type QuestionType = 
  | 'text' 
  | 'number' 
  | 'checkbox' 
  | 'radio' 
  | 'dropdown' 
  | 'date' 
  | 'yes_no';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For radio, dropdown
  required: boolean;
  description?: string;
}

export type ChecklistType = 'pre_exam' | 'post_exam' | 'custom';

export interface ChecklistTemplate {
  id: string;
  title: string;
  description: string | null;
  type: ChecklistType;
  questions: Question[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistSubmission {
  id: string;
  template_id: string;
  submitted_by: string;
  branch_id: string | null;
  submitted_at: string;
  answers: Record<string, any>; // question_id -> answer
  status: string;
}

export interface ChecklistSubmissionWithDetails extends ChecklistSubmission {
  template: ChecklistTemplate;
  submitter?: {
    full_name: string;
    email: string;
  };
}
