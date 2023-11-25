import dgram from 'dgram';
import net from 'net';

const udp = dgram.createSocket('udp4');

type Wire = {
  ip: string,
  port: number,
}

type Client = {
  wire: Wire,
  addr: Uint8Array,
}

const clients: Client[] = [];

interface Packet {
  version: number;
  hoplimit: number;
  payload: number;
  source: Uint8Array;
  dest: Uint8Array;
  data: Uint8Array;
}

function parseMessage(msg: Buffer) {
  const version = msg.readUInt8(0);
  const hoplimit = msg.readUInt8(1);
  const payload = msg.readInt16BE(2);
  const source = new Uint8Array(msg).slice(4, 12);
  const dest = new Uint8Array(msg).slice(12, 20);
  const data = new Uint8Array(msg).slice(20, 20 + payload);

  if (20 + payload > msg.length) {
    throw new Error(`Message is too small ${msg.length} vs. ${20 + payload}`);
  }

  return {
    version,
    hoplimit,
    payload,
    source,
    dest,
    data,
  };
}

function encodePacket(packet: Packet) {
  const buf = new Uint8Array(20 + packet.data.length);

  buf[0] = packet.version;
  buf[1] = packet.hoplimit;
  buf[2] = packet.payload >> 8;
  buf[3] = packet.payload & 0xff;
  buf.set(packet.source, 4);
  buf.set(packet.dest, 12);
  buf.set(packet.data, 20);

  return buf;
}

function arraysEqual(arr1: Uint8Array, arr2: Uint8Array): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }

  return arr1.every((value, index) => value === arr2[index])
}

const routerAddr = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

udp.on('message', (msg, rinfo) => {
  console.log(msg);
  const packet = parseMessage(msg);
  console.log(packet);

  if (packet.hoplimit <= 0) {
    console.error("Dropping packet due to hop limit");
    return;
  }

  if (arraysEqual(packet.dest, routerAddr)) {
    console.log("Adding client", rinfo.address, rinfo.port, packet.source);
    clients.push({
      wire: {
        ip: rinfo.address,
        port: rinfo.port,
      },
      addr: packet.source,
    });
    return;
  }

  packet.hoplimit -= 1;

  clients.forEach((client) => {
    if (arraysEqual(client.addr, packet.dest)) {
      console.log("Sending to", client.wire.ip, client.wire.port);
      udp.send(encodePacket(packet), client.wire.port, client.wire.ip);
    }
  });
});

udp.bind(13337);
