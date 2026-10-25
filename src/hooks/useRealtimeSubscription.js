/**
 * Real-time Subscription Hook
 * Subscribe to Supabase real-time changes for automatic data updates
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, useSupabase } from '@/lib/supabase';

/**
 * Subscribe to real-time changes on a Supabase table
 * Automatically invalidates React Query cache when changes occur
 *
 * @param {string} tableName - The table to subscribe to
 * @param {string|string[]} queryKey - React Query key(s) to invalidate on changes
 * @param {Object} options - Additional options
 * @param {string} options.event - Event to listen for ('*', 'INSERT', 'UPDATE', 'DELETE')
 * @param {string} options.schema - Database schema (default: 'public')
 * @param {string} options.filter - Optional filter (e.g., 'id=eq.123')
 * @param {Function} options.onInsert - Callback for INSERT events
 * @param {Function} options.onUpdate - Callback for UPDATE events
 * @param {Function} options.onDelete - Callback for DELETE events
 * @param {boolean} options.enabled - Whether subscription is enabled (default: true)
 */
export function useRealtimeSubscription(tableName, queryKey, options = {}) {
  const queryClient = useQueryClient();
  const isSupabaseEnabled = useSupabase();
  const channelRef = useRef(null);

  const {
    event = '*',
    schema = 'public',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    enabled = true,
  } = options;

  useEffect(() => {
    // Don't subscribe if Supabase isn't configured or subscription is disabled
    if (!isSupabaseEnabled || !supabase || !enabled) {
      return;
    }

    const channelName = `${tableName}_changes_${Date.now()}`;

    const channelConfig = {
      event,
      schema,
      table: tableName,
    };

    // Add filter if provided
    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, (payload) => {
        // Invalidate queries to trigger refetch
        const keys = Array.isArray(queryKey) ? queryKey : [queryKey];
        keys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });

        // Call specific event handlers if provided
        if (payload.eventType === 'INSERT' && onInsert) {
          onInsert(payload.new);
        } else if (payload.eventType === 'UPDATE' && onUpdate) {
          onUpdate(payload.new, payload.old);
        } else if (payload.eventType === 'DELETE' && onDelete) {
          onDelete(payload.old);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${tableName} changes`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to ${tableName} changes`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tableName, queryKey, event, schema, filter, enabled, isSupabaseEnabled, queryClient, onInsert, onUpdate, onDelete]);

  return {
    isSubscribed: !!channelRef.current,
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    },
  };
}

/**
 * Subscribe to multiple tables at once
 * @param {Array<{table: string, queryKey: string|string[], options?: Object}>} subscriptions
 */
export function useMultipleRealtimeSubscriptions(subscriptions) {
  const queryClient = useQueryClient();
  const isSupabaseEnabled = useSupabase();
  const channelsRef = useRef([]);

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      return;
    }

    // Set up all subscriptions
    const channels = subscriptions.map(({ table, queryKey, options = {} }) => {
      const { event = '*', schema = 'public', filter } = options;
      const channelName = `${table}_changes_${Date.now()}_${Math.random()}`;

      const channelConfig = {
        event,
        schema,
        table,
      };

      if (filter) {
        channelConfig.filter = filter;
      }

      return supabase
        .channel(channelName)
        .on('postgres_changes', channelConfig, () => {
          const keys = Array.isArray(queryKey) ? queryKey : [queryKey];
          keys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: [key] });
          });
        })
        .subscribe();
    });

    channelsRef.current = channels;

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [subscriptions, isSupabaseEnabled, queryClient]);

  return {
    isSubscribed: channelsRef.current.length > 0,
    unsubscribeAll: () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    },
  };
}

export default useRealtimeSubscription;
