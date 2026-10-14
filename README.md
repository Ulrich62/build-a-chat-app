# Build a Chat App

A real-time multi-client WebSocket chat application built with Node.js and the `ws` library.

## Features

- **HTTP Server**: Serves the chat frontend UI and JavaScript client.
- **WebSocket Server**: Uses `ws` attached directly to the HTTP server on port 3001.
- **System Join Notifications**: Broadcasts `{ type: "system", text: "<username> joined" }` on client connection.
- **Real-Time Chat Messaging**: Broadcasts `{ type: "chat", username, text }` to all connected clients.
- **System Leave Notifications**: Broadcasts `{ type: "system", text: "<username> left" }` on client disconnect.

## Getting Started

```bash
npm install
npm start
```

Open `http://localhost:3001` in one or multiple browser windows to chat in real-time.

## Running Tests

```bash
npm test
```

## License

MIT © [Ulrich ADIMI](https://github.com/Ulrich62)
