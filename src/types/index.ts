export interface UserProfile {
  id: string
  email: string
  email_2fa_enabled: boolean
  created_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  color: string | null
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  folder_id: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface NoteTag {
  note_id: string
  tag_id: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface NoteLink {
  source_note_id: string
  target_note_id: string
}

export interface NoteWithTags extends Note {
  tags: Tag[]
  folder?: Folder | null
}

export interface FolderWithNotes extends Folder {
  notes: NoteWithTags[]
  subfolders: FolderWithNotes[]
}

export type EditorMode = 'edit' | 'preview' | 'split'

export interface SearchResult {
  note: NoteWithTags
  matched_text: string
}