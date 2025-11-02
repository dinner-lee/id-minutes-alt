# Right Detail Panel - New Features

## Overview
The RightDetailPanel has been enhanced with project-specific To-Do and Notes management functionality, along with a collapsible panel feature.

## What's New

### 1. **To-Do Tab**
- ✅ Add new tasks with title (required), due date, and assignee (optional)
- ✅ Hierarchical task structure (parent tasks with sub-tasks)
- ✅ Complete/incomplete checkbox with visual feedback (strikethrough + gray text)
- ✅ Edit due date and assignee after creation
- ✅ Delete tasks with confirmation
- ✅ Expandable/collapsible sub-tasks
- ✅ Shows task metadata (added date, due date, assignee)

### 2. **Notes Tab**
- ✅ Add new notes with text content
- ✅ Display author name and timestamp in bottom right corner
- ✅ Delete notes with confirmation
- ✅ Chronological ordering (newest first)

### 3. **Collapsible Panel**
- ✅ Collapse panel to right edge with chevron button
- ✅ Small expansion button visible when collapsed
- ✅ Works in both tabs view and attachment details view

### 4. **Mock Users** (for assignment)
- moon05@snu.ac.kr (Minsun Cho)
- dydgns7138@snu.ac.kr (Yonghun Shin)
- ubfjun@snu.ac.kr (Jinju Pyo)
- jjl0909@snu.ac.kr (Jungchan Lee)

## Database Changes

### New Models Added
1. **TodoItem** - Stores project tasks with hierarchical support
2. **Note** - Stores project notes

## API Endpoints Created

### To-Dos
- `GET /api/projects/[id]/todos` - Fetch all todos
- `POST /api/projects/[id]/todos` - Create new todo
- `PATCH /api/projects/[id]/todos/[todoId]` - Update todo
- `DELETE /api/projects/[id]/todos/[todoId]` - Delete todo

### Notes
- `GET /api/projects/[id]/notes` - Fetch all notes
- `POST /api/projects/[id]/notes` - Create new note
- `PATCH /api/projects/[id]/notes/[noteId]` - Update note
- `DELETE /api/projects/[id]/notes/[noteId]` - Delete note

## Important: Completed Steps

### 1. ✅ Database Migration - DONE
The database has been successfully updated with the new TodoItem and Note tables.

### 2. ✅ User Authentication Integration - DONE
The API routes now use the `getOrCreateDevUser()` helper function (same pattern as the rest of the app).
- Uses `DEV_USER_EMAIL` environment variable or defaults to "dev@example.com"
- Automatically creates the user if it doesn't exist
- No client-side changes needed

### 3. Optional: Replace Mock Users
Currently using hardcoded mock users. You can optionally:
- Fetch actual project members from the database
- Update the `MOCK_USERS` constant with real user data
- Add user management UI

## Usage

1. **When no attachment is selected**: The panel shows To-Do and Notes tabs
2. **When an attachment is selected**: The panel shows attachment details
3. **Collapse/Expand**: Click the chevron button in the top right to collapse/expand the panel

## Features in Action

### To-Do Hierarchy Example
```
- Main Task 1
  - Subtask 1.1
  - Subtask 1.2
- Main Task 2
  - Subtask 2.1
    - (You can add sub-subtasks by clicking + on any task)
```

### Task States
- **Uncompleted**: Normal text, empty checkbox
- **Completed**: Gray text, strikethrough, checked checkbox

## Technical Details

- **State Management**: Local React state with API persistence
- **Database**: PostgreSQL via Prisma ORM
- **UI**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React

## Files Modified/Created

### Modified
- `prisma/schema.prisma` - Added TodoItem and Note models
- `src/app/projects/[projectId]/components/RightDetailPanel.tsx` - Complete rewrite

### Created
- `src/app/api/projects/[id]/todos/route.ts`
- `src/app/api/projects/[id]/todos/[todoId]/route.ts`
- `src/app/api/projects/[id]/notes/route.ts`
- `src/app/api/projects/[id]/notes/[noteId]/route.ts`

## Notes
- All data is project-specific and persists in the database
- Deletion actions require user confirmation
- The panel automatically fetches data when a project is loaded
- Responsive design works well on different screen sizes

