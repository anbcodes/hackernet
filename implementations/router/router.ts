import dgram from 'dgram';

const socket = dgram.createSocket('udp4');

const clients = [
  {
    wire: {
      ip: '127.0.0.1',
      port: 13001,
    },
    addr: new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01])
  },
  {
    wire: {
      ip: '127.0.0.1',
      port: 13002,
    },
    addr: new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02])
  }
];

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

socket.on('message', (msg) => {
  console.log(msg);
  const packet = parseMessage(msg);
  console.log(packet);

  if (packet.hoplimit <= 0) {
    console.error("Dropping packet due to hop limit");
    return;
  }

  packet.hoplimit -= 1;

  clients.forEach((client) => {
    if (arraysEqual(client.addr, packet.dest)) {
      socket.send(encodePacket(packet), client.wire.port, client.wire.ip);
    }
  });
});

socket.bind(13337);
