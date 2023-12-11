import { HDPSocket } from "@anbcodes/hackernet";

const client = new HDPSocket('0.2', undefined, 13337, 'localhost');

client.send('0.1', 2000, new TextEncoder().encode('Hello, world!'));

client.onPacket((packet, hp) => {
  console.log("Recieved packet from", hp.packet.source.join('.'));
  console.log("Data", new TextDecoder().decode(packet.data));
})
