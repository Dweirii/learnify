import { inngest } from '../src/lib/inngest';

async function testStreamEventsIntegration() {
  console.log('🧪 Testing Stream Events Integration...');
  
  try {
    // Test stream started event
    console.log('Triggering stream started event...');
    await inngest.send({
      name: "livekit/stream.started",
      data: {
        ingressId: "test-ingress-123",
        userId: "test-user-id",
        streamId: "test-stream-id",
      },
    });
    
    // Test participant joined event
    console.log('Triggering participant joined event...');
    await inngest.send({
      name: "livekit/participant.joined",
      data: {
        userId: "test-user-id",
        participantIdentity: "user_test-viewer-id",
        streamId: "test-stream-id",
      },
    });
    
    console.log('✅ Stream events integration tests triggered');
    console.log('Check Inngest dashboard for execution results');
    console.log('Expected: XP awarded for stream start, view session started');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStreamEventsIntegration().catch(console.error);
