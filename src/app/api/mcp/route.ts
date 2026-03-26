import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface MCPRequest {
  jsonrpc: string
  id: number
  method: string
  params?: {
    name?: string
    arguments?: Record<string, unknown>
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: MCPRequest = await request.json()
    
    if (body.method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {}
          },
          serverInfo: {
            name: 'Bexiter MCP Server',
            version: '1.0.0'
          }
        }
      })
    }

    if (body.method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          tools: [
            {
              name: 'bexiter_search_notes',
              description: 'Search notes by title or content',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Search query' }
                },
                required: ['query']
              }
            },
            {
              name: 'bexiter_get_note',
              description: 'Get a specific note by ID or title',
              inputSchema: {
                type: 'object',
                properties: {
                  identifier: { type: 'string', description: 'Note ID or title' }
                },
                required: ['identifier']
              }
            },
            {
              name: 'bexiter_list_notes',
              description: 'List all notes, optionally filtered by folder',
              inputSchema: {
                type: 'object',
                properties: {
                  folder_id: { type: 'string', description: 'Folder ID (optional)' },
                  limit: { type: 'number', description: 'Number of notes to return' }
                }
              }
            },
            {
              name: 'bexiter_create_note',
              description: 'Create a new note',
              inputSchema: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Note title' },
                  content: { type: 'string', description: 'Note content (markdown)' },
                  folder_id: { type: 'string', description: 'Folder ID (optional)' }
                },
                required: ['title']
              }
            },
            {
              name: 'bexiter_update_note',
              description: 'Update an existing note',
              inputSchema: {
                type: 'object',
                properties: {
                  note_id: { type: 'string', description: 'Note ID' },
                  title: { type: 'string', description: 'New title' },
                  content: { type: 'string', description: 'New content' }
                },
                required: ['note_id']
              }
            },
            {
              name: 'bexiter_list_folders',
              description: 'List all folders',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            },
            {
              name: 'bexiter_list_tags',
              description: 'List all tags',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            }
          ]
        }
      })
    }

    if (body.method === 'tools/call') {
      const toolName = body.params?.name
      const args = body.params?.arguments as Record<string, unknown> | undefined

      let result: unknown

      switch (toolName) {
        case 'bexiter_search_notes': {
          const query = args?.query as string
          const { data: notes } = await supabase
            .from('notes')
            .select('id, title, content, folder_id, created_at, updated_at')
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .limit(20)
          result = notes || []
          break
        }

        case 'bexiter_get_note': {
          const identifier = args?.identifier as string
          const { data: note } = await supabase
            .from('notes')
            .select('id, title, content, folder_id, created_at, updated_at')
            .eq('id', identifier)
            .single()
          
          if (!note) {
            const { data: noteByTitle } = await supabase
              .from('notes')
              .select('id, title, content, folder_id, created_at, updated_at')
              .ilike('title', identifier)
              .limit(1)
            result = noteByTitle?.[0] || null
          } else {
            result = note
          }
          break
        }

        case 'bexiter_list_notes': {
          const folderId = args?.folder_id as string | undefined
          let query = supabase
            .from('notes')
            .select('id, title, content, folder_id, created_at, updated_at')
            .eq('is_archived', false)
            .order('updated_at', { ascending: false })
          
          if (folderId) {
            query = query.eq('folder_id', folderId)
          }
          
          const limit = args?.limit as number | undefined
          if (limit) {
            query = query.limit(limit)
          }
          
          const { data: notes } = await query
          result = notes || []
          break
        }

        case 'bexiter_create_note': {
          const title = args?.title as string
          const content = args?.content as string || ''
          const folderId = args?.folder_id as string | undefined
          
          const { data: note, error } = await supabase
            .from('notes')
            .insert({
              title,
              content,
              folder_id: folderId || null
            })
            .select()
            .single()
          
          if (error) {
            result = { error: error.message }
          } else {
            result = note
          }
          break
        }

        case 'bexiter_update_note': {
          const noteId = args?.note_id as string
          const title = args?.title as string | undefined
          const content = args?.content as string | undefined
          
          const updates: Record<string, unknown> = {}
          if (title) updates.title = title
          if (content !== undefined) updates.content = content
          updates.updated_at = new Date().toISOString()
          
          const { data: note, error } = await supabase
            .from('notes')
            .update(updates)
            .eq('id', noteId)
            .select()
            .single()
          
          if (error) {
            result = { error: error.message }
          } else {
            result = note
          }
          break
        }

        case 'bexiter_list_folders': {
          const { data: folders } = await supabase
            .from('folders')
            .select('id, name, parent_id, color, created_at')
            .order('name')
          result = folders || []
          break
        }

        case 'bexiter_list_tags': {
          const { data: tags } = await supabase
            .from('tags')
            .select('id, name, color, created_at')
            .order('name')
          result = tags || []
          break
        }

        default:
          result = { error: `Unknown tool: ${toolName}` }
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      })
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id: body.id,
      error: {
        code: -32601,
        message: `Method not found: ${body.method}`
      }
    })
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: 1,
      error: {
        code: -32603,
        message: 'Internal error',
        data: String(error)
      }
    })
  }
}

export async function GET() {
  return NextResponse.json({
    server: 'Bexiter MCP Server',
    version: '1.0.0',
    description: 'API for interacting with Bexiter notes',
    endpoints: {
      POST: '/api/mcp - MCP protocol interface'
    }
  })
}