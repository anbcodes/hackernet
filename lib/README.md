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

### Hacker Datagram Protocol (HDP)

The Hacker Datagram Protocol ([spec](/specs/transport.md)) is the equivalent of
the UDP protocol on the internet. There is one main class for interacting with
the Hacker Datagram Protocol: `HDPSocket`. Since HDP is connectionless, there is
no need for a specific client or server class.

Below is an example of an echo server.

```ts
import { HDPSocket } from "@anbcodes/hackernet";

const server = new HDPSocket("0.1", 2000, 13337, "localhost");

server.onPacket((packet, hp) => {
  console.log("Recieved packet from", hp.packet.source.join("."));

  server.send(hp.packet.source, packet.srcPort, packet.data);
});
```

And here's an example that sends a message to the server and outputs the
response.

```ts
import { HDPSocket } from "@anbcodes/hackernet";

const client = new HDPSocket("0.2", undefined, 13337, "localhost");

client.send("0.1", 2000, new TextEncoder().encode("Hello, world!"));

client.onPacket((packet, hp) => {
  console.log("Recieved packet from", hp.packet.source.join("."));
  console.log("Data", new TextDecoder().decode(packet.data));
});
```
