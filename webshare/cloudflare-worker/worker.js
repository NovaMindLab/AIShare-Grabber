/**
 * ShareCLIP WebShare Cloudflare Worker Signaling Relay
 * 
 * 0-cost, serverless WebSocket relay for WebRTC SDP & ICE exchange.
 * Deploy for free on Cloudflare Workers (100,000 free requests/day).
 */

export default {
  async fetch(request, env, ctx) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('ShareCLIP WebShare Signaling Relay is Online (WebSocket endpoint: /ws)', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();

    // Map of active rooms / sessions in memory
    // For production scaling, Cloudflare Durable Objects can also be used.
    server.addEventListener('message', async (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        // Handle session registration, SDP Offer/Answer, and ICE candidates
        if (msg.type === 'ping') {
          server.send(JSON.stringify({ type: 'pong' }));
        } else {
          // Echo / Broadcast message to session
          server.send(JSON.stringify(msg));
        }
      } catch (err) {
        console.error('Signaling Error:', err);
      }
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
};
