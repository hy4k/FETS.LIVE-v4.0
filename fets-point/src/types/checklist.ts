export type QuestionType =
  | 'text'
  | 'number'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'date'
  | 'time'
  | 'textarea';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For radio, dropdown
  required: boolean;
  description?: string;
the  attachment_mode?: 'none' | 'optional' | 'required';
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export type ChecklistType = 'pre_exam' | 'post_exam' | 'custom';

export interface ChecklistTemplate {
  id: string;
  title: string;
  description: string | null;
  type: ChecklistType;
  questions: Question[];
  is_active: boolean;
  branch_location?: string;
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
  attachments?: Record<string, Attachment[]>; // question_id -> attachments
  status: string;
}

export interface ChecklistSubmissionWithDetails extends ChecklistSubmission {
  checklist_templates: {
    title: string;
    type: ChecklistType;
    questions?: any;
  };
  submitted_by_profile: {
    full_name: string;
  };
  created_at: string;
}
