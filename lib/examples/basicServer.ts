import { HPServer } from "@anbcodes/hackernet";

const server = new HPServer('0.0');

server.on('packet', (packet, rinfo) => {
  console.log("Got packet from", rinfo, packet);

  server.send(packet.source, packet.data);
})

