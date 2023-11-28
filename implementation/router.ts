import { HPError, HPServer, addrEquals } from "@anbcodes/hackernet";

const server = new HPServer('0', 13337, '0.0.0.0');

server.on('allPackets', (packet, rinfo) => {
  console.log('got packet', packet, rinfo);

  if (addrEquals(packet.dest, server.hpAddress)) {
    console.log('For me!!', packet, rinfo);
    return;
  }

  try {
    server.sendPacket(packet);
  } catch (e) {
    if (e instanceof HPError && e.code === 'NO_ROUTE_TO_HOST') {
      server.send(packet.source, new TextEncoder().encode('NO_ROUTE_TO_HOST'));
    }
  }
})

