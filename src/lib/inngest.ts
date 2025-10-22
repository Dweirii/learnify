import { Inngest } from "inngest";

/**
 * Inngest Client Configuration
 * 
 * This client is used to:
 * 1. Send events from our webhook handlers
 * 2. Define background functions that process events
 * 
 * The event key is used for authentication when sending events
 */
export const inngest = new Inngest({ 
  id: "learnify-app",
  name: "Learnify Streaming Platform",
  
  // For local development, we don't need event key
  // For production, uncomment the line below:
  // eventKey: process.env.INNGEST_EVENT_KEY,
});