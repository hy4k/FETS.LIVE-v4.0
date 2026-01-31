# Add New Case Category

Add a new category to the Raise A Case system.

## Instructions

To add a new case category:

1. **Update config file**: `src/config/caseCategories.config.ts`

```typescript
{
  id: 'new_category',           // Unique lowercase identifier
  label: 'New Category',        // Display name
  icon: IconName,               // Import from lucide-react
  color: '#hexcolor',           // Brand color
  bgColor: '#hexcolor',         // Light background color
  showVendorFields: false,      // Set true if external vendors may be involved
  followUpQuestions: [
    {
      id: 'question_id',
      label: 'Question Label',
      type: 'text' | 'textarea' | 'select' | 'date' | 'time',
      options: ['Option 1', 'Option 2'],  // For select type
      required: true,
      placeholder: 'Helpful placeholder text'
    }
  ]
}
```

2. **Add to sidebar filter**: Update `SOURCES` array in `IncidentManager.tsx`

```typescript
{ id: 'new_category', label: 'New Category', icon: IconName },
```

3. **Import the icon**: Add to lucide-react imports in both files

4. **Color palette suggestions**:
   - Blue: `#3b82f6` / `#eff6ff`
   - Purple: `#8b5cf6` / `#f5f3ff`
   - Green: `#10b981` / `#ecfdf5`
   - Orange: `#f59e0b` / `#fffbeb`
   - Rose: `#f43f5e` / `#fff1f2`
   - Cyan: `#06b6d4` / `#ecfeff`

## Ask me:
- What should the category be called?
- What follow-up questions are needed?
- Are external vendors typically involved?
- What icon best represents this category?
