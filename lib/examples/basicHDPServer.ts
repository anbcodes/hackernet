import { HDPSocket } from "@anbcodes/hackernet";

const server = new HDPSocket('0.1', 2000, 13337, 'localhost');

server.onPacket((packet, hp) => {
  console.log("Recieved packet from", hp.packet.source.join('.'));

  server.send(hp.packet.source, packet.srcPort, packet.data);
})
