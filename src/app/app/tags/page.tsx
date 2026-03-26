'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Tag, Plus, X, Trash2, Edit } from 'lucide-react'
import type { Tag as TagType } from '@/types'
import { getRandomColor } from '@/lib/utils'

export default function TagsPage() {
  const { user } = useAuth()
  const supabase = createSupabaseBrowserClient()
  
  const [tags, setTags] = useState<TagType[]>([])
  const [showNewTag, setShowNewTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(getRandomColor())
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    if (user) {
      loadTags()
    }
  }, [user])

  const loadTags = async () => {
    const { data } = await supabase
      .from('tags')
      .select('*')
      .order('name')
    
    if (data) setTags(data)
  }

  const createTag = async () => {
    if (!newTagName.trim() || !user) return
    
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: newTagName.trim(),
        color: newTagColor,
        user_id: user.id
      })
      .select()
      .single()
    
    if (!error && data) {
      setTags(prev => [...prev, data])
      setNewTagName('')
      setNewTagColor(getRandomColor())
      setShowNewTag(false)
    }
  }

  const updateTag = async (tagId: string) => {
    if (!editName.trim()) return
    
    const { error } = await supabase
      .from('tags')
      .update({ name: editName.trim() })
      .eq('id', tagId)
    
    if (!error) {
      setTags(prev => prev.map(t => t.id === tagId ? { ...t, name: editName.trim() } : t))
      setEditingTag(null)
    }
  }

  const deleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return
    
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)
    
    if (!error) {
      setTags(prev => prev.filter(t => t.id !== tagId))
    }
  }

  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16',
    '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
    '#6366F1', '#8B5CF6', '#A855F7', '#EC4899'
  ]

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Tag size={28} className="text-gray-600 dark:text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tags
            </h1>
          </div>
          <button
            onClick={() => setShowNewTag(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} />
            New Tag
          </button>
        </div>

        {/* New Tag Form */}
        {showNewTag && (
          <div className="mb-6 p-4 bg-[var(--sidebar-bg)] rounded-lg border border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-[var(--border-color)] rounded-md text-gray-900 dark:text-white"
                autoFocus
              />
              <div className="flex items-center gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-6 h-6 rounded-full ${newTagColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={createTag}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewTag(false)}
                className="p-2 text-gray-500 hover:bg-[var(--hover-bg)] rounded-md"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Tags List */}
        {tags.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No tags yet. Create your first tag to organize your notes!
          </div>
        ) : (
          <div className="space-y-2">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-4 bg-[var(--sidebar-bg)] rounded-lg border border-[var(--border-color)]"
              >
                {editingTag === tag.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1 bg-white dark:bg-gray-800 border border-[var(--border-color)] rounded text-gray-900 dark:text-white"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateTag(tag.id)
                        if (e.key === 'Escape') setEditingTag(null)
                      }}
                    />
                    <button
                      onClick={() => updateTag(tag.id)}
                      className="text-green-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTag(null)}
                      className="text-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {tag.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingTag(tag.id)
                          setEditName(tag.name)
                        }}
                        className="p-2 hover:bg-[var(--hover-bg)] rounded text-gray-500"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteTag(tag.id)}
                        className="p-2 hover:bg-[var(--hover-bg)] rounded text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}