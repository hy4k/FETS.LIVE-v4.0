export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      branch_status: {
        Row: {
          branch_name: string
          candidates_today: number | null
          created_at: string | null
          id: string
          incidents_open: number | null
          last_updated: string | null
          network_status: string | null
          power_status: string | null
          staff_present: number | null
          staff_total: number | null
          system_health: string | null
          workstations_active: number | null
          workstations_total: number | null
        }
        Insert: {
          branch_name: string
          candidates_today?: number | null
          created_at?: string | null
          id?: string
          incidents_open?: number | null
          last_updated?: string | null
          network_status?: string | null
          power_status?: string | null
          staff_present?: number | null
          staff_total?: number | null
          system_health?: string | null
          workstations_active?: number | null
          workstations_total?: number | null
        }
        Update: {
          branch_name?: string
          candidates_today?: number | null
          created_at?: string | null
          id?: string
          incidents_open?: number | null
          last_updated?: string | null
          network_status?: string | null
          power_status?: string | null
          staff_present?: number | null
          staff_total?: number | null
          system_health?: string | null
          workstations_active?: number | null
          workstations_total?: number | null
        }
        Relationships: []
      }
      candidate_roster_uploads: {
        Row: {
          created_at: string | null
          error_log: string | null
          exam_provider: string
          failed_candidates: number | null
          file_type: string
          filename: string
          id: string
          processed_candidates: number | null
          processed_date: string | null
          status: string | null
          total_candidates: number | null
          updated_at: string | null
          upload_date: string | null
          uploaded_by_user_id: string
        }
        Insert: {
          created_at?: string | null
          error_log?: string | null
          exam_provider: string
          failed_candidates?: number | null
          file_type: string
          filename: string
          id?: string
          processed_candidates?: number | null
          processed_date?: string | null
          status?: string | null
          total_candidates?: number | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by_user_id: string
        }
        Update: {
          created_at?: string | null
          error_log?: string | null
          exam_provider?: string
          failed_candidates?: number | null
          file_type?: string
          filename?: string
          id?: string
          processed_candidates?: number | null
          processed_date?: string | null
          status?: string | null
          total_candidates?: number | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by_user_id?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          address: string | null
          branch_location: string | null
          center_id: string | null
          check_in_time: string | null
          client_name: string | null
          confirmation_number: string | null
          created_at: string | null
          exam_date: string | null
          exam_name: string | null
          full_name: string
          id: string
          locker_key: string | null
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
          upload_batch_id: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          branch_location?: string | null
          center_id?: string | null
          check_in_time?: string | null
          client_name?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          exam_date?: string | null
          exam_name?: string | null
          full_name: string
          id?: string
          locker_key?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          upload_batch_id?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          branch_location?: string | null
          center_id?: string | null
          check_in_time?: string | null
          client_name?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          exam_date?: string | null
          exam_name?: string | null
          full_name?: string
          id?: string
          locker_key?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          upload_batch_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          author_id: string
          branch_location: string | null
          content: string
          created_at: string | null
          id: string
          is_broadcast: boolean | null
          media_path: string | null
          recipient_id: string | null
          room_id: string | null
          room_type: string | null
        }
        Insert: {
          author_id: string
          branch_location?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_broadcast?: boolean | null
          media_path?: string | null
          recipient_id?: string | null
          room_id?: string | null
          room_type?: string | null
        }
        Update: {
          author_id?: string
          branch_location?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_broadcast?: boolean | null
          media_path?: string | null
          recipient_id?: string | null
          room_id?: string | null
          room_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_instance_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          estimated_time_minutes: number | null
          id: string
          instance_id: string
          is_completed: boolean | null
          notes: string | null
          priority: string | null
          responsible_role: string | null
          sort_order: number | null
          template_item_id: string | null
          title: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          estimated_time_minutes?: number | null
          id?: string
          instance_id: string
          is_completed?: boolean | null
          notes?: string | null
          priority?: string | null
          responsible_role?: string | null
          sort_order?: number | null
          template_item_id?: string | null
          title: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          estimated_time_minutes?: number | null
          id?: string
          instance_id?: string
          is_completed?: boolean | null
          notes?: string | null
          priority?: string | null
          responsible_role?: string | null
          sort_order?: number | null
          template_item_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_instance_items_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "checklist_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_instance_items_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_template_items"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_instances: {
        Row: {
          branch_location: string | null
          category: string
          completed_at: string | null
          created_at: string
          created_by: string
          exam_date: string
          id: string
          name: string
          template_id: string
          updated_at: string
        }
        Insert: {
          branch_location?: string | null
          category: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          exam_date: string
          id?: string
          name: string
          template_id: string
          updated_at?: string
        }
        Update: {
          branch_location?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          exam_date?: string
          id?: string
          name?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          assigned_to: string | null
          branch_location: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          branch_location?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          branch_location?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_items: {
        Row: {
          created_at: string
          description: string | null
          estimated_time_minutes: number | null
          id: string
          notes: string | null
          priority: string | null
          responsible_role: string | null
          sort_order: number | null
          template_id: string
          title: string
          question_type: string | null
          dropdown_options: Json | null
          is_required: boolean | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_time_minutes?: number | null
          id?: string
          notes?: string | null
          priority?: string | null
          responsible_role?: string | null
          sort_order?: number | null
          template_id: string
          title: string
          question_type?: string | null
          dropdown_options?: Json | null
          is_required?: boolean | null
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_time_minutes?: number | null
          id?: string
          notes?: string | null
          priority?: string | null
          responsible_role?: string | null
          sort_order?: number | null
          template_id?: string
          title?: string
          question_type?: string | null
          dropdown_options?: Json | null
          is_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          is_admin: boolean | null
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_admin?: boolean | null
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_admin?: boolean | null
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_group: boolean | null
          last_message_at: string | null
          last_message_preview: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      desktop_post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "desktop_post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "desktop_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "desktop_public_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      desktop_post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "desktop_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "desktop_public_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "desktop_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      desktop_public_posts: {
        Row: {
          author_id: string
          branch_location: string | null
          content: string | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
          media_urls: string[] | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          branch_location?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          media_urls?: string[] | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          branch_location?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          media_urls?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_desktop_post_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      desktop_sticky_notes: {
        Row: {
          color: string | null
          content: string | null
          created_at: string | null
          height: number | null
          id: string
          is_deleted: boolean | null
          position_x: number | null
          position_y: number | null
          updated_at: string | null
          user_id: string
          width: number | null
          z_index: number | null
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string | null
          height?: number | null
          id?: string
          is_deleted?: boolean | null
          position_x?: number | null
          position_y?: number | null
          updated_at?: string | null
          user_id: string
          width?: number | null
          z_index?: number | null
        }
        Update: {
          color?: string | null
          content?: string | null
          created_at?: string | null
          height?: number | null
          id?: string
          is_deleted?: boolean | null
          position_x?: number | null
          position_y?: number | null
          updated_at?: string | null
          user_id?: string
          width?: number | null
          z_index?: number | null
        }
        Relationships: []
      }
      events: {
        Row: {
          assigned_to: string | null
          branch_location: string | null
          category: string | null
          closed_at: string | null
          closure_remarks: string | null
          created_at: string | null
          description: string | null
          event_date: string
          id: string
          priority: string | null
          reporter_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          branch_location?: string | null
          category?: string | null
          closed_at?: string | null
          closure_remarks?: string | null
          created_at?: string | null
          description?: string | null
          event_date: string
          id?: string
          priority?: string | null
          reporter_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          branch_location?: string | null
          category?: string | null
          closed_at?: string | null
          closure_remarks?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string
          id?: string
          priority?: string | null
          reporter_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      incident_comments: {
        Row: {
          author_full_name: string
          author_id: string
          body: string
          created_at: string
          id: number
          incident_id: string
        }
        Insert: {
          author_full_name: string
          author_id: string
          body: string
          created_at?: string
          id?: number
          incident_id: string
        }
        Update: {
          author_full_name?: string
          author_id?: string
          body?: string
          created_at?: string
          id?: number
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          branch_location: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          is_todo_task: boolean | null
          notes: string | null
          reporter: string
          severity: string | null
          status: string | null
          title: string
          todo_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          branch_location?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          is_todo_task?: boolean | null
          notes?: string | null
          reporter: string
          severity?: string | null
          status?: string | null
          title: string
          todo_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          branch_location?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          is_todo_task?: boolean | null
          notes?: string | null
          reporter?: string
          severity?: string | null
          status?: string | null
          title?: string
          todo_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kudos: {
        Row: {
          created_at: string
          giver_id: string | null
          id: number
          message: string
          receiver_id: string | null
        }
        Insert: {
          created_at?: string
          giver_id?: string | null
          id?: number
          message: string
          receiver_id?: string | null
        }
        Update: {
          created_at?: string
          giver_id?: string | null
          id?: number
          message?: string
          receiver_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kudos_giver_id_fkey"
            columns: ["giver_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudos_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          reason: string | null
          request_type: string
          requested_date: string
          status: string | null
          swap_date: string | null
          swap_with_user_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          request_type: string
          requested_date: string
          status?: string | null
          swap_date?: string | null
          swap_with_user_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          request_type?: string
          requested_date?: string
          status?: string | null
          swap_date?: string | null
          swap_with_user_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_updates: {
        Row: {
          branch_location: string | null
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          priority: string | null
          updated_at: string | null
        }
        Insert: {
          branch_location?: string | null
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_location?: string | null
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notices: {
        Row: {
          branch_location: string | null
          created_at: string | null
          description: string
          expires_at: string
          id: string
          priority: string | null
          title: string
        }
        Insert: {
          branch_location?: string | null
          created_at?: string | null
          description: string
          expires_at: string
          id?: string
          priority?: string | null
          title: string
        }
        Update: {
          branch_location?: string | null
          created_at?: string | null
          description?: string
          expires_at?: string
          id?: string
          priority?: string | null
          title?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          post_id: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          post_id?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          id: string
          path: string
          post_id: string | null
          thumb_path: string | null
          type: string | null
        }
        Insert: {
          id?: string
          path: string
          post_id?: string | null
          thumb_path?: string | null
          type?: string | null
        }
        Update: {
          id?: string
          path?: string
          post_id?: string | null
          thumb_path?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          branch_location: string | null
          centre: string | null
          content: string | null
          created_at: string | null
          id: string
          pinned: boolean | null
          visibility: string | null
          post_type: string | null
          file_url: string | null
          poll_options: any | null
        }
        Insert: {
          author_id?: string | null
          branch_location?: string | null
          centre?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          pinned?: boolean | null
          visibility?: string | null
        }
        Update: {
          author_id?: string | null
          branch_location?: string | null
          centre?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          pinned?: boolean | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_level: string | null
          avatar_url: string | null
          base_centre: string | null
          bio: string | null
          branch_assigned: string | null
          centre: string | null
          certificates_obtained: number | null
          cover_image_url: string | null
          created_at: string | null
          department: string | null
          email: string
          employee_id: string | null
          full_name: string
          id: string
          join_date: string | null
          leaves_taken: number | null
          location: string | null
          phone: string | null
          position: string | null
          profile_picture_url: string | null
          role: string
          tasks_assigned: number | null
          total_overtime_hours: number | null
          training_modules_completed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_level?: string | null
          avatar_url?: string | null
          base_centre?: string | null
          bio?: string | null
          branch_assigned?: string | null
          centre?: string | null
          certificates_obtained?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          employee_id?: string | null
          full_name: string
          id?: string
          join_date?: string | null
          leaves_taken?: number | null
          location?: string | null
          phone?: string | null
          position?: string | null
          profile_picture_url?: string | null
          role: string
          tasks_assigned?: number | null
          total_overtime_hours?: number | null
          training_modules_completed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_level?: string | null
          avatar_url?: string | null
          base_centre?: string | null
          bio?: string | null
          branch_assigned?: string | null
          centre?: string | null
          certificates_obtained?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          join_date?: string | null
          leaves_taken?: number | null
          location?: string | null
          phone?: string | null
          position?: string | null
          profile_picture_url?: string | null
          role?: string
          tasks_assigned?: number | null
          total_overtime_hours?: number | null
          training_modules_completed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: number
          subscription: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          subscription: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          subscription?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      roster_schedules: {
        Row: {
          branch_location: string | null
          created_at: string | null
          date: string
          id: string
          overtime_hours: number | null
          profile_id: string | null
          shift_code: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          branch_location?: string | null
          created_at?: string | null
          date: string
          id?: string
          overtime_hours?: number | null
          profile_id?: string | null
          shift_code: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_location?: string | null
          created_at?: string | null
          date?: string
          id?: string
          overtime_hours?: number | null
          profile_id?: string | null
          shift_code?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_schedules_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          branch_location: string | null
          candidate_count: number
          client_name: string
          created_at: string | null
          date: string
          end_time: string
          exam_name: string
          id: number
          start_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          branch_location?: string | null
          candidate_count?: number
          client_name: string
          created_at?: string | null
          date: string
          end_time: string
          exam_name: string
          id?: number
          start_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          branch_location?: string | null
          candidate_count?: number
          client_name?: string
          created_at?: string | null
          date?: string
          end_time?: string
          exam_name?: string
          id?: number
          start_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          base_centre: string | null
          branch_assigned: string | null
          certifications: string[] | null
          created_at: string | null
          department: string
          email: string
          full_name: string
          hire_date: string | null
          id: string
          is_online: boolean | null
          notes: string | null
          phone: string | null
          role: string
          skills: string[] | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          base_centre?: string | null
          branch_assigned?: string | null
          certifications?: string[] | null
          created_at?: string | null
          department: string
          email: string
          full_name: string
          hire_date?: string | null
          id?: string
          is_online?: boolean | null
          notes?: string | null
          phone?: string | null
          role: string
          skills?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          base_centre?: string | null
          branch_assigned?: string | null
          certifications?: string[] | null
          created_at?: string | null
          department?: string
          email?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          is_online?: boolean | null
          notes?: string | null
          phone?: string | null
          role?: string
          skills?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      staff_schedules: {
        Row: {
          branch_location: string | null
          created_at: string | null
          id: string
          schedule_date: string
          shift_type: string | null
          staff_profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          branch_location?: string | null
          created_at?: string | null
          id?: string
          schedule_date: string
          shift_type?: string | null
          staff_profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_location?: string | null
          created_at?: string | null
          id?: string
          schedule_date?: string
          shift_type?: string | null
          staff_profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          conversation_id: string
          started_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          started_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          last_seen: string
          online: boolean
          user_id: string
        }
        Insert: {
          last_seen?: string
          online?: boolean
          user_id: string
        }
        Update: {
          last_seen?: string
          online?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          centre: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          centre?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          centre?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          role?: string | null
        }
        Relationships: []
      }
      vault: {
        Row: {
          author_id: string
          category: string
          category_id: string | null
          content: string | null
          created_at: string | null
          description: string | null
          file_size: string | null
          file_url: string | null
          id: string
          is_confidential: boolean | null
          is_deleted: boolean | null
          mime_type: string | null
          priority: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          category?: string
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          is_confidential?: boolean | null
          is_deleted?: boolean | null
          mime_type?: string | null
          priority?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          category?: string
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          is_confidential?: boolean | null
          is_deleted?: boolean | null
          mime_type?: string | null
          priority?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vault_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_categories: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vault_item_pins: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_item_pins_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "vault"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_item_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wall_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "wall_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wall_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wall_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "wall_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wall_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_posts: {
        Row: {
          author_id: string | null
          branch_location: string | null
          content: string
          created_at: string | null
          id: string
          pinned: boolean | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          branch_location?: string | null
          content: string
          created_at?: string | null
          id?: string
          pinned?: boolean | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          branch_location?: string | null
          content?: string
          created_at?: string | null
          id?: string
          pinned?: boolean | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wall_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    news_ticker: {
      Row: {
        branch_location: string | null
        content: string
        created_at: string | null
        created_by: string | null
        expires_at: string | null
        id: string
        is_active: boolean | null
        priority: string | null
      }
      Insert: {
        branch_location?: string | null
        content: string
        created_at?: string | null
        created_by?: string | null
        expires_at?: string | null
        id?: string
        is_active?: boolean | null
        priority?: string | null
      }
      Update: {
        branch_location?: string | null
        content?: string
        created_at?: string | null
        created_by?: string | null
        expires_at?: string | null
        id?: string
        is_active?: boolean | null
        priority?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "news_ticker_created_by_fkey"
          columns: ["created_by"]
          isOneToOne: false
          referencedRelation: "staff_profiles"
          referencedColumns: ["id"]
        }
      ]
    }
    user_settings: {
      Row: {
        date_format: string | null
        language: string | null
        notifications: Json | null
        theme: string | null
        timezone: string | null
        updated_at: string | null
        user_id: string
      }
      Insert: {
        date_format?: string | null
        language?: string | null
        notifications?: Json | null
        theme?: string | null
        timezone?: string | null
        updated_at?: string | null
        user_id: string
      }
      Update: {
        date_format?: string | null
        language?: string | null
        notifications?: Json | null
        theme?: string | null
        timezone?: string | null
        updated_at?: string | null
        user_id?: string
      }
      Relationships: []
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_typing_indicators: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_or_create_dm_conversation: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_staff_profile_id: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_authorized: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_incident_open: {
        Args: { p_incident_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_date_discrepancies: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          new_date: string
          old_date: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
