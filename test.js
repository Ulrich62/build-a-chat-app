import assert from "assert";
import { WebSocket } from "ws";
import { server, wss } from "./server.js";

function open(ws) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Timeout opening ws")), 3000);
    ws.addEventListener("open", () => {
      clearTimeout(t);
      resolve();
    }, { once: true });
    ws.addEventListener("error", (e) => {
      clearTimeout(t);
      reject(e);
    }, { once: true });
  });
}

async function runTests() {
  console.log("Running Chat App tests...\n");

  try {
    // Test 1: GET /
    const res = await fetch("http://localhost:3001/");
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get("content-type").includes("text/html"));
    console.log("✓ GET / responded with 200 and text/html");

    // Test 2: WebSocket connect
    const tester = new WebSocket("ws://localhost:3001?username=Tester");
    await open(tester);
    tester.close();
    console.log("✓ WebSocket client connected successfully");

    // Test 3: Join system message
    const observer = new WebSocket("ws://localhost:3001?username=Observer");
    await open(observer);

    const joinMsgPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out waiting for join")), 3000);
      observer.addEventListener("message", function handler(event) {
        const msg = JSON.parse(event.data);
        if (msg.type === "system" && msg.text.includes("Alice")) {
          clearTimeout(timer);
          observer.removeEventListener("message", handler);
          resolve(msg);
        }
      });
    });

    const alice = new WebSocket("ws://localhost:3001?username=Alice");
    await open(alice);
    const joinMsg = await joinMsgPromise;
    assert.strictEqual(joinMsg.type, "system");
    assert.ok(joinMsg.text.includes("Alice joined"));
    console.log("✓ Client join system broadcast passed");

    // Test 4: Chat broadcast
    const chatMsgPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out waiting for chat")), 3000);
      observer.addEventListener("message", function handler(event) {
        const msg = JSON.parse(event.data);
        if (msg.type === "chat" && msg.username === "Alice") {
          clearTimeout(timer);
          observer.removeEventListener("message", handler);
          resolve(msg);
        }
      });
    });

    alice.send(JSON.stringify({ username: "Alice", text: "Hello everyone!" }));
    const chatMsg = await chatMsgPromise;
    assert.strictEqual(chatMsg.type, "chat");
    assert.strictEqual(chatMsg.text, "Hello everyone!");
    console.log("✓ Chat message broadcast passed");

    // Test 5: Leave system message
    const leaveMsgPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out waiting for leave")), 3000);
      observer.addEventListener("message", function handler(event) {
        const msg = JSON.parse(event.data);
        if (msg.type === "system" && msg.text.includes("Alice") && msg.text.includes("left")) {
          clearTimeout(timer);
          observer.removeEventListener("message", handler);
          resolve(msg);
        }
      });
    });

    alice.close();
    const leaveMsg = await leaveMsgPromise;
    assert.strictEqual(leaveMsg.type, "system");
    assert.ok(leaveMsg.text.includes("Alice left"));
    console.log("✓ Client disconnect system broadcast passed");

    observer.close();
    console.log("\n✓ All Chat App tests passed successfully!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    wss.close();
    server.close();
    process.exit(0);
  }
}

// Give server 100ms to listen
setTimeout(runTests, 100);
