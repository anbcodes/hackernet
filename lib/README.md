# HackerNet TS Lib

A bunch of classes and functions for interacting with the hackernet.

## Documentation

### Hacker Protocol (HP)

The Hacker Protocol ([spec](/specs/routing.md)) is the equivalent of the IP
protocol for the internet. There are two main classes for interacting with the
Hacker Protocol: `HPServer` and `HPClient`.

Below is an example of an echo server.

```ts
import { HPServer } from "@anbcodes/hackernet";

const server = new HPServer("0.0");

server.on("packet", (packet, rinfo) => {
  console.log("Got packet from", rinfo, packet);

  server.send(packet.source, packet.data);
});
```

And here is an example of a client that sends "Hello, world!" to the server.

```ts
import { HPClient } from "@anbcodes/hackernet";

const client = new HPClient("0.1", "localhost");

client.send("0.0", new TextEncoder().encode("Hello, world!"));

client.on("packet", (packet) => {
  console.log("Received", packet);
  console.log("Data", new TextDecoder().decode(packet.data));
});
```
