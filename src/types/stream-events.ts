/**
 * TypeScript Types for Stream Events
 */

export interface StreamEvent {
  type: 'stream.started' | 'stream.ended' | 'viewer.joined' | 'viewer.left' | 'viewer.count.updated' | 'connection.established' | 'connection.stats' | 'ping' | 'message.pinned' | 'message.unpinned';
  streamId: string;
  userId: string;
  data: StreamEventData;
  timestamp: string;
}

export type StreamEventData = 
  | StreamStartedData
  | StreamEndedData
  | ViewerJoinedData
  | ViewerLeftData
  | ViewerCountUpdatedData
  | ConnectionEstablishedData
  | ConnectionStatsData
  | PingData
  | MessagePinnedData
  | MessageUnpinnedData;

export interface StreamStartedData {
  isLive: boolean;
  ingressId: string;
}

export interface StreamEndedData {
  isLive: boolean;
  ingressId: string;
}

export interface ViewerJoinedData {
  viewerCount: number;
}

export interface ViewerLeftData {
  viewerCount: number;
}

export interface ViewerCountUpdatedData {
  viewerCount: number;
}

export interface ConnectionEstablishedData {
  connectionId: string;
  streamId: string;
  message: string;
}

export interface ConnectionStatsData {
  totalConnections: number;
  streamConnections: number;
}

export interface PingData {
  // Empty data for ping events - using object type instead of empty interface
  [key: string]: never;
}

export interface MessagePinnedData {
  messageId: string;
  message: string;
  from: {
    name: string;
    identity: string;
  };
  timestamp: number;
}

export interface MessageUnpinnedData {
  messageId: string;
}

export interface StreamStartedEvent extends StreamEvent {
  type: 'stream.started';
  data: StreamStartedData;
}

export interface StreamEndedEvent extends StreamEvent {
  type: 'stream.ended';
  data: StreamEndedData;
}

export interface ViewerJoinedEvent extends StreamEvent {
  type: 'viewer.joined';
  data: ViewerJoinedData;
}

export interface ViewerLeftEvent extends StreamEvent {
  type: 'viewer.left';
  data: ViewerLeftData;
}

export interface ViewerCountUpdatedEvent extends StreamEvent {
  type: 'viewer.count.updated';
  data: ViewerCountUpdatedData;
}

export interface ConnectionEstablishedEvent extends StreamEvent {
  type: 'connection.established';
  data: ConnectionEstablishedData;
}

export interface ConnectionStatsEvent extends StreamEvent {
  type: 'connection.stats';
  data: ConnectionStatsData;
}

export interface PingEvent extends StreamEvent {
  type: 'ping';
  data: PingData;
}

export interface MessagePinnedEvent extends StreamEvent {
  type: 'message.pinned';
  data: MessagePinnedData;
}

export interface MessageUnpinnedEvent extends StreamEvent {
  type: 'message.unpinned';
  data: MessageUnpinnedData;
}

export type TypedStreamEvent = 
  | StreamStartedEvent
  | StreamEndedEvent
  | ViewerJoinedEvent
  | ViewerLeftEvent
  | ViewerCountUpdatedEvent
  | ConnectionEstablishedEvent
  | ConnectionStatsEvent
  | PingEvent
  | MessagePinnedEvent
  | MessageUnpinnedEvent;

export interface ConnectionStats {
  totalConnections: number;
  streamConnections: number;
}

export interface StreamUpdateState {
  isConnected: boolean;
  connectionStats: ConnectionStats | null;
  lastEvent: StreamEvent | null;
  error: Error | null;
  reconnect: () => void;
  disconnect: () => void;
}
