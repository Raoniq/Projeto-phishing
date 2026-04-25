/**
 * Training Tracks API Hook
 * For admin management of training content
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import type { Database } from '../supabase'

type TrainingTrack = Database['public']['Tables']['training_tracks']['Row']
type TrainingModule = Database['public']['Tables']['training_modules']['Row']
type TrainingLesson = Database['public']['Tables']['training_lessons']['Row']
type UserEnrollment = Database['public']['Tables']['user_training_enrollments']['Row']

export function useTrainingTracks() {
  const [tracks, setTracks] = useState<TrainingTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTracks = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('training_tracks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTracks(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracks')
    } finally {
      setLoading(false)
    }
  }, [])

  const createTrack = useCallback(async (track: {
    name: string
    description?: string
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
    estimated_duration_minutes?: number
    is_required?: boolean
  }) => {
    const { data, error } = await supabase
      .from('training_tracks')
      .insert(track)
      .select()
      .single()

    if (error) throw error
    setTracks(prev => [data, ...prev])
    return data
  }, [])

  const updateTrack = useCallback(async (id: string, updates: Partial<TrainingTrack>) => {
    const { data, error } = await supabase
      .from('training_tracks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setTracks(prev => prev.map(t => t.id === id ? data : t))
    return data
  }, [])

  const deleteTrack = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('training_tracks')
      .delete()
      .eq('id', id)

    if (error) throw error
    setTracks(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    fetchTracks()
  }, [fetchTracks])

  return { tracks, loading, error, refetch: fetchTracks, createTrack, updateTrack, deleteTrack }
}

export function useTrainingModules(trackId: string) {
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .eq('track_id', trackId)
        .order('sequence_order', { ascending: true })

      if (error) throw error
      setModules(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch modules')
    } finally {
      setLoading(false)
    }
  }, [trackId])

  const createModule = useCallback(async (module: {
    track_id: string
    title: string
    sequence_order?: number
    content_type?: 'video' | 'interactive' | 'reading' | 'game'
    content_url?: string
    duration_minutes?: number
  }) => {
    const { data, error } = await supabase
      .from('training_modules')
      .insert({ ...module, track_id: trackId })
      .select()
      .single()

    if (error) throw error
    setModules(prev => [...prev, data].sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0)))
    return data
  }, [trackId])

  const updateModule = useCallback(async (id: string, updates: Partial<TrainingModule>) => {
    const { data, error } = await supabase
      .from('training_modules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setModules(prev => prev.map(m => m.id === id ? data : m))
    return data
  }, [])

  const deleteModule = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('training_modules')
      .delete()
      .eq('id', id)

    if (error) throw error
    setModules(prev => prev.filter(m => m.id !== id))
  }, [])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  return { modules, loading, error, refetch: fetchModules, createModule, updateModule, deleteModule }
}

export function useUserEnrollments(userId?: string) {
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEnrollments = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_training_enrollments')
        .select('*, training_tracks(name, difficulty_level, estimated_duration_minutes)')
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false })

      if (error) throw error
      setEnrollments(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch enrollments')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const enrollUser = useCallback(async (pUserId: string, trackId: string, dueDate?: string) => {
    const { data, error } = await supabase
      .from('user_training_enrollments')
      .insert({
        user_id: pUserId,
        track_id: trackId,
        assigned_due_date: dueDate,
        status: 'assigned'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }, [])

  const updateProgress = useCallback(async (enrollmentId: string, progress: number, completed = false) => {
    const { data, error } = await supabase
      .from('user_training_enrollments')
      .update({
        progress,
        status: completed ? 'completed' : 'in_progress',
        completed_at: completed ? new Date().toISOString() : null
      })
      .eq('id', enrollmentId)
      .select()
      .single()

    if (error) throw error
    setEnrollments(prev => prev.map(e => e.id === enrollmentId ? data : e))
    return data
  }, [])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  return { enrollments, loading, error, refetch: fetchEnrollments, enrollUser, updateProgress }
}