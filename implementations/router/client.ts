import dgram from 'dgram';
import { createInterface } from 'readline';

const udp = dgram.createSocket('udp4');

const debug = process.argv[4] === 'debug';

interface Packet {
  version: number;
  hoplimit: number;
  payload: number;
  source: Uint8Array;
  dest: Uint8Array;
  data: Uint8Array;
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

function sendMessage(packet: Packet) {
  const buf = encodePacket(packet);
  udp.send(buf, 13337, 'localhost', function (error) {
    if (error) {
      console.log('Error: ', error);
    }
  });
}

function parseAddr(str: string) {
  const parts = str.split('.');
  const addr = new Uint8Array(8);
  addr.set(parts.map((part) => parseInt(part, 10)), 8 - parts.length);
  return addr;
}


const source = parseAddr(process.argv[2]);
const dest = parseAddr(process.argv[3]);


const packet = {
  version: 1,
  hoplimit: 10,
  payload: 0,
  source,
  dest: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]),
  data: new Uint8Array(),
};

udp.on('message', (msg, rinfo) => {
  const packet = parseMessage(msg);
  if (debug) {
    console.log(`\x1b[DEBUG HOPS ${packet.hoplimit} LEN ${packet.payload}`);
  }
  console.log(`\x1b[G${packet.source.join('.')}: ${new TextDecoder().decode(packet.data)}`);
  rl.prompt();
});

sendMessage(packet);

const rl = createInterface(
  {
    input: process.stdin,
    output: process.stdout,
    prompt: '>',
  }
)

rl.prompt();

rl.on('line', (line) => {
  const data = new TextEncoder().encode(line);
  const packet = {
    version: 0,
    hoplimit: 10,
    payload: data.length,
    source: source,
    dest: dest,
    data: data,
  };
  sendMessage(packet);
  rl.prompt();
});