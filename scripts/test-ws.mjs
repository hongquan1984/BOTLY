import nextEnv from '@next/env';

const env = nextEnv.loadEnvConfig('d:\\botly').combinedEnv;
const projectRef = env.SUPABASE_PROJECT_REF || 'rswmadukvegraxfcdbcb';
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY;

console.log('Project ref:', projectRef);
const wsUrl = `wss://${projectRef}.supabase.co/realtime/v1/websocket?apikey=${key}&vsn=1.0.0`;
console.log('Testing WebSocket connection to:', wsUrl.slice(0, 60) + '...');

try {
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('✓ WebSocket connected successfully!');

    // Join channel
    const joinMsg = JSON.stringify({
      topic: 'realtime:healthclues-presence-test',
      event: 'phx_join',
      payload: { config: { broadcast: { ack: true } } },
      ref: '1'
    });
    console.log('Sending join message...');
    ws.send(joinMsg);
  };

  ws.onmessage = (event) => {
    console.log('Received WebSocket message:', event.data);
    const parsed = JSON.parse(event.data);
    if (parsed.event === 'phx_reply' && parsed.payload?.status === 'ok') {
      console.log('✓ Successfully joined Supabase Realtime channel!');

      // Send a test broadcast
      const broadcastMsg = JSON.stringify({
        topic: 'realtime:healthclues-presence-test',
        event: 'broadcast',
        payload: {
          type: 'broadcast',
          event: 'pos',
          payload: { user: 'tester', x: 750, y: 420 }
        },
        ref: '2'
      });
      console.log('Sending broadcast message...');
      ws.send(broadcastMsg);

      setTimeout(() => {
        ws.close();
        console.log('WebSocket test completed successfully!');
        process.exit(0);
      }, 1000);
    }
  };

  ws.onerror = (err) => {
    console.error('WebSocket error:', err.message || err);
    process.exit(1);
  };

  setTimeout(() => {
    console.log('Timeout waiting for WebSocket');
    ws.close();
    process.exit(0);
  }, 5000);
} catch (e) {
  console.error('Exception:', e);
}
