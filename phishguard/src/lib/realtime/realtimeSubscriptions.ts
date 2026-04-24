/**
 * Realtime subscription helpers for PhishGuard dashboard
 * Provides subscription functions for campaign_events, campaign_targets, and presence
 */

import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface CampaignEventPayload {
  id: string;
  campaign_target_id: string;
  event_type: 'sent' | 'opened' | 'clicked' | 'reported' | 'failed';
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  target_email?: string;
}

export interface CampaignTargetPayload {
  id: string;
  campaign_id: string;
  email: string;
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'reported' | 'failed';
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  reported_at: string | null;
  failed_at: string | null;
  created_at: string;
}

export interface PresenceState {
  user_id: string;
  user_email: string;
  user_name: string;
  online_at: string;
  presence_ref?: string;
}

export type CampaignEventCallback = (event: CampaignEventPayload) => void;
export type CampaignTargetCallback = (target: CampaignTargetPayload, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
export type PresenceCallback = (presenceState: PresenceState[], joined?: PresenceState, left?: PresenceState) => void;

// ============================================================================
// Campaign Events Subscription
// ============================================================================

/**
 * Subscribe to INSERT events on campaign_events table for a specific campaign
 * Use for live counters and activity feeds
 *
 * @param campaignId - The campaign ID to filter events
 * @param callback - Called with each new event
 * @returns Unsubscribe function
 */
export function subscribeToCampaignEvents(
  campaignId: string,
  callback: CampaignEventCallback
): () => void {
  const channel = supabase
    .channel(`campaign-events-${campaignId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'campaign_events',
        filter: `campaign_target_id=in.(SELECT id FROM campaign_targets WHERE campaign_id='${campaignId}')`,
      },
      async (payload: RealtimePostgresChangesPayload<CampaignEventPayload>) => {
        const newEvent = payload.new as CampaignEventPayload;

        // Enrich with target email if not already present
        if (!newEvent.target_email) {
          const { data: target } = await supabase
            .from('campaign_targets')
            .select('email')
            .eq('id', newEvent.campaign_target_id)
            .single();

          if (target) {
            newEvent.target_email = target.email;
          }
        }

        callback(newEvent);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================================
// Campaign Targets Subscription
// ============================================================================

/**
 * Subscribe to changes on campaign_targets table for a specific campaign
 * Use for live target status updates
 *
 * @param campaignId - The campaign ID to filter targets
 * @param callback - Called with each target change
 * @returns Unsubscribe function
 */
export function subscribeToTargetUpdates(
  campaignId: string,
  callback: CampaignTargetCallback
): () => void {
  const channel = supabase
    .channel(`campaign-targets-${campaignId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'campaign_targets',
        filter: `campaign_id=eq.${campaignId}`,
      },
      (payload: RealtimePostgresChangesPayload<CampaignTargetPayload>) => {
        const { eventType } = payload;
        callback(payload.new as CampaignTargetPayload, eventType as 'INSERT' | 'UPDATE' | 'DELETE');
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================================
// Presence Subscription
// ============================================================================

/**
 * Subscribe to presence updates for a room (e.g., campaign workspace)
 * Use for admin presence indicators
 *
 * @param roomId - The room identifier (e.g., campaign ID or 'admin-dashboard')
 * @param callback - Called with presence state changes
 * @returns Unsubscribe function
 */
export function subscribeToPresence(
  roomId: string,
  callback: PresenceCallback
): () => void {
  const channel = supabase.channel(`presence-${roomId}`);

  channel.on(
    'presence',
    { event: 'sync' },
    () => {
      const state = channel.presenceState<PresenceState>();
      const presenceArray = Object.values(state).flat();
      callback(presenceArray);
    }
  );

  channel.on(
    'presence',
    { event: 'join' },
    (payload: { newPresences: PresenceState[] }) => {
      callback([], undefined, payload.newPresences[0]);
    }
  );

  channel.on(
    'presence',
    { event: 'leave' },
    (payload: { leftPresences: PresenceState[] }) => {
      callback([], undefined, payload.leftPresences[0]);
    }
  );

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: 'current-user', // Should be replaced with actual user data
        user_email: 'user@example.com',
        user_name: 'User',
        online_at: new Date().toISOString(),
      });
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================================
// Batch Subscription Helper
// ============================================================================

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

/**
 * Subscribe to multiple realtime sources at once
 * Convenience function for dashboard initialization
 *
 * @param campaignId - The campaign ID
 * @param callbacks - Object containing all callbacks
 * @returns Object with unsubscribe functions for each subscription
 */
export function subscribeToCampaignRealtime(
  campaignId: string,
  callbacks: {
    onEvent?: CampaignEventCallback;
    onTargetUpdate?: CampaignTargetCallback;
    onPresence?: PresenceCallback;
  }
): {
  events?: RealtimeSubscription;
  targets?: RealtimeSubscription;
  presence?: RealtimeSubscription;
  unsubscribeAll: () => void;
} {
  const subscriptions: { unsubscribe: () => void }[] = [];

  if (callbacks.onEvent) {
    subscriptions.push({
      unsubscribe: subscribeToCampaignEvents(campaignId, callbacks.onEvent),
    });
  }

  if (callbacks.onTargetUpdate) {
    subscriptions.push({
      unsubscribe: subscribeToTargetUpdates(campaignId, callbacks.onTargetUpdate),
    });
  }

  if (callbacks.onPresence) {
    subscriptions.push({
      unsubscribe: subscribeToPresence(campaignId, callbacks.onPresence),
    });
  }

  return {
    get events() {
      return subscriptions[0];
    },
    get targets() {
      return subscriptions[1];
    },
    get presence() {
      return subscriptions[2];
    },
    unsubscribeAll: () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    },
  };
}
