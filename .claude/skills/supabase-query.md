# Supabase Database Query

Help with Supabase database operations following FETS.LIVE patterns.

## Instructions

### Service Layer Pattern (REQUIRED)
Always use the service layer in `src/services/api.service.ts`. Never call Supabase directly from components.

### Available Services:
- `candidatesService` - Candidate management
- `incidentsService` - Case/incident operations
- `rosterService` - Staff scheduling
- `checklistService` - Checklist operations
- `profilesService` - User profile management

### Adding a New Service Method:

```typescript
// In api.service.ts
export const myService = {
  async getAll(filters?: { branch_location?: string }) {
    let query = supabase
      .from('table_name')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.branch_location && filters.branch_location !== 'global') {
      query = query.eq('branch_location', filters.branch_location)
    }

    const { data, error } = await query
    if (error) throw new ApiError(error.message, error.code, error)
    return data
  },

  async create(item: TablesInsert<'table_name'>) {
    const { data, error } = await supabase
      .from('table_name')
      .insert(item)
      .select()
      .single()

    if (error) throw new ApiError(error.message, error.code, error)
    return data
  },

  async update(id: string, updates: TablesUpdate<'table_name'>) {
    const { data, error } = await supabase
      .from('table_name')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new ApiError(error.message, error.code, error)
    return data
  }
}
```

### Key Tables:
- `staff_profiles` - User profiles (linked via user_id)
- `incidents` - Cases/incidents
- `incident_comments` - Case comments/timeline
- `candidates` - Candidate records
- `roster_schedules` - Staff schedules
- `checklists` / `checklist_templates`
- `posts` / `comments` / `reactions` - Social features

### Real-time Subscriptions:
```typescript
const channel = supabase.channel('channel-name')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'table_name',
    filter: `branch_location=eq.${activeBranch}`
  }, (payload) => {
    // Handle change
  })
  .subscribe()

// Cleanup
return () => supabase.removeChannel(channel)
```

## Ask me:
- What data do you need to query?
- Do you need real-time updates?
- What filters are needed?
