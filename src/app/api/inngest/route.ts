import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";

// Import all our Inngest functions
import { streamStarted } from "@/inngest/functions/stream-started";
import { streamEnded } from "@/inngest/functions/stream-ended";
import { participantJoined } from "@/inngest/functions/participant-joined";
import { participantLeft } from "@/inngest/functions/participant-left";
import { xpCalculator, manualXpCalculation } from "@/inngest/functions/xp-calculator";
import { leaderboardCacheRefresh, manualLeaderboardRefresh } from "@/inngest/functions/leaderboard-cache-refresh";


const functions = [
    // Existing functions
    streamStarted, 
    streamEnded, 
    participantJoined, 
    participantLeft,
    
    // Gamification functions
    xpCalculator,
    manualXpCalculation,
    leaderboardCacheRefresh,
    manualLeaderboardRefresh,
  ];
// Export the Inngest API route handler
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions,
    
    // Signing key for production security
    // Verifies requests actually come from Inngest
    signingKey: process.env.INNGEST_SIGNING_KEY,
    
    // Streaming: "force" allows long-running functions (fix type)
    streaming: "force",

})