/**
 * Campaigns API Hook
 * For creating and managing phishing campaigns
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import type { Database } from '../supabase'

type Campaign = Database['public']['Tables']['campaigns']['Row']
type CampaignTarget = Database['public']['Tables']['campaign_targets']['Row']

export interface CampaignWithStats extends Campaign {
  stats: {
    sent: number
    opened: number
    clicked: number
    reported: number
    compromised: number
  }
}

async function fetchCampaignStats(campaignId: string) {
  const { data: targets, error } = await supabase
    .from('campaign_targets')
    .select('status, sent_at, opened_at, clicked_at, reported_at')
    .eq('campaign_id', campaignId)

  if (error || !targets) {
    return { sent: 0, opened: 0, clicked: 0, reported: 0, compromised: 0 }
  }

  const sent = targets.filter(t => t.sent_at !== null).length
  const opened = targets.filter(t => t.opened_at !== null).length
  const clicked = targets.filter(t => t.clicked_at !== null).length
  const reported = targets.filter(t => t.reported_at !== null).length
  // compromised = clicked - reported (those who clicked but didn't report)
  const compromised = Math.max(0, clicked - reported)

  return { sent, opened, clicked, reported, compromised }
}

export function useCampaigns(companyId?: string) {
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    if (!companyId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch stats for each campaign
      const campaignsWithStats = await Promise.all(
        (data || []).map(async (campaign) => {
          const stats = await fetchCampaignStats(campaign.id)
          return { ...campaign, stats }
        })
      )

      setCampaigns(campaignsWithStats)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  const createCampaign = useCallback(async (campaign: {
    name: string
    company_id: string
    description?: string
    template_id?: string
    status?: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
    scheduled_at?: string
    target_count?: number
    settings?: Record<string, unknown>
  }) => {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single()

    if (error) throw error
    const campaignWithStats: CampaignWithStats = {
      ...data,
      stats: { sent: 0, opened: 0, clicked: 0, reported: 0, compromised: 0 }
    }
    setCampaigns(prev => [campaignWithStats, ...prev])
    return campaignWithStats
  }, [])

  const updateCampaign = useCallback(async (id: string, updates: Partial<Campaign>) => {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setCampaigns(prev => prev.map(c => c.id === id ? data : c))
    return data
  }, [])

  const deleteCampaign = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)

    if (error) throw error
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }, [])

  const launchCampaign = useCallback(async (id: string) => {
    return updateCampaign(id, {
      status: 'running',
      started_at: new Date().toISOString()
    })
  }, [updateCampaign])

  const pauseCampaign = useCallback(async (id: string) => {
    return updateCampaign(id, { status: 'paused' })
  }, [updateCampaign])

  const cancelCampaign = useCallback(async (id: string) => {
    return updateCampaign(id, {
      status: 'cancelled',
      completed_at: new Date().toISOString()
    })
  }, [updateCampaign])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    launchCampaign,
    pauseCampaign,
    cancelCampaign
  }
}

export function useCampaignTargets(campaignId: string) {
  const [targets, setTargets] = useState<CampaignTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTargets = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('campaign_targets')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTargets(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch targets')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  const addTargets = useCallback(async (newTargets: Array<{
    campaign_id: string
    user_id: string
    email: string
  }>) => {
    const { data, error } = await supabase
      .from('campaign_targets')
      .insert(newTargets)
      .select()

    if (error) throw error
    setTargets(prev => [...prev, ...data])
    return data
  }, [])

  const removeTarget = useCallback(async (targetId: string) => {
    const { error } = await supabase
      .from('campaign_targets')
      .delete()
      .eq('id', targetId)

    if (error) throw error
    setTargets(prev => prev.filter(t => t.id !== targetId))
  }, [])

  const updateTargetStatus = useCallback(async (targetId: string, status: CampaignTarget['status'], extraData?: {
    sent_at?: string
    opened_at?: string
    clicked_at?: string
    reported_at?: string
  }) => {
    const { data, error } = await supabase
      .from('campaign_targets')
      .update({ status, ...extraData })
      .eq('id', targetId)
      .select()
      .single()

    if (error) throw error
    setTargets(prev => prev.map(t => t.id === targetId ? data : t))
    return data
  }, [])

  useEffect(() => {
    fetchTargets()
  }, [fetchTargets])

  return {
    targets,
    loading,
    error,
    refetch: fetchTargets,
    addTargets,
    removeTarget,
    updateTargetStatus
  }
}

export function useCampaignAnalytics(campaignId: string) {
  const [stats, setStats] = useState({
    sent: 0,
    opened: 0,
    clicked: 0,
    reported: 0,
    failed: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)

        // Get all targets with their events
        const { data: targets, error: targetsError } = await supabase
          .from('campaign_targets')
          .select('*')
          .eq('campaign_id', campaignId)

        if (targetsError) throw targetsError

        const counts = {
          sent: targets?.filter(t => t.status !== 'pending' && t.status !== 'failed').length || 0,
          opened: targets?.filter(t => t.opened_at !== null).length || 0,
          clicked: targets?.filter(t => t.clicked_at !== null).length || 0,
          reported: targets?.filter(t => t.reported_at !== null).length || 0,
          failed: targets?.filter(t => t.status === 'failed').length || 0
        }

        setStats(counts)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [campaignId])

  return {
    stats,
    loading,
    error,
    openRate: stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : '0',
    clickRate: stats.sent > 0 ? ((stats.clicked / stats.sent) * 100).toFixed(1) : '0',
    reportRate: stats.sent > 0 ? ((stats.reported / stats.sent) * 100).toFixed(1) : '0'
  }
}