import * as dgram from 'dgram';
import { HPClient, HPPacket, HPServer, parseAddress } from "./hp";

interface HDPPacket {
  srcPort: number;
  dstPort: number;
  length: number;
  checksum: number;
  data: Uint8Array;
}

export function encodeHDPPacket(packet: HDPPacket): Uint8Array {
  const buf = new Uint8Array(8 + packet.data.length);

  buf[0] = packet.srcPort >> 8;
  buf[1] = packet.srcPort & 0xff;
  buf[2] = packet.dstPort >> 8;
  buf[3] = packet.dstPort & 0xff;
  buf[4] = packet.length >> 8;
  buf[5] = packet.length & 0xff;
  buf[6] = packet.checksum >> 8;
  buf[7] = packet.checksum & 0xff;
  buf.set(packet.data, 8);

  return buf;
}

export function decodeHDPPacket(buf: Uint8Array): HDPPacket {
  const srcPort = (buf[0] << 8) | buf[1];
  const dstPort = (buf[2] << 8) | buf[3];
  const length = (buf[4] << 8) | buf[5];
  const checksum = (buf[6] << 8) | buf[7];
  const data = buf.slice(8, 8 + length);

  if (8 + length > buf.length) {
    throw new Error(`Message is too small ${buf.length} vs. ${8 + length}`);
  }

  return {
    srcPort,
    dstPort,
    length,
    checksum,
    data,
  };
}

export function randomPort(): number {
  return Math.floor(Math.random() * 65536);
}

/**
 * A Hacker Datagram Protocol Socket
 * A HDP socket lets you communicate over something like UDP, but with the Hacker Protocol.
 */
export class HDPSocket {
  public port: number | undefined;
  public hpAddress: Uint8Array;
  public hpClient: HPClient;

  private listeners: {
    packet: ((packet: HDPPacket, raw: { packet: HPPacket, rinfo: dgram.RemoteInfo }) => void)[];
  } = {
      packet: [],
    }

  constructor(hpAddress: Uint8Array | string, port?: number, tport: number = 13337, thost: string = 'localhost') {
    this.port = port;
    this.hpAddress = typeof hpAddress === 'string' ? parseAddress(hpAddress) : hpAddress;
    this.hpClient = new HPClient(hpAddress, thost, tport);
    this.hpClient.on("packet", this.handlePacket.bind(this))
    // Required to register with the router.
    this.hpClient.send('0', new Uint8Array());
  }

  handlePacket(rawPacket: HPPacket, rinfo: dgram.RemoteInfo) {
    const packet = decodeHDPPacket(rawPacket.data);
    if (!this.port || packet.dstPort === this.port) {
      this.listeners.packet.forEach((listener) => listener(packet, { packet: rawPacket, rinfo }));
    }
  }

  /**
   * Sends a packet to a given address
   * @param addr the address
   * @param packet the packet
   */
  public sendPacket(addr: Uint8Array | string, packet: HDPPacket) {
    const rawPacket = encodeHDPPacket(packet);
    this.hpClient.send(parseAddress(addr), rawPacket);
  }

  /**
   * Sends data to a given port and address
   * @param addr the address
   * @param port the port
   * @param data the data
   */

  public send(addr: Uint8Array | string, port: number, data: Uint8Array) {
    this.sendPacket(addr, {
      srcPort: this.port || randomPort(),
      dstPort: port,
      length: data.length,
      checksum: 0,
      data,
    })

  }

  /**
   * Registers a function to listen for packets
   * If the port is specified in the constructor, it will only listen for packets on that port.
   * @param listener the listener
   */
  public onPacket(listener: (packet: HDPPacket, raw: { packet: HPPacket, rinfo: dgram.RemoteInfo }) => void) {
    this.listeners.packet.push(listener);
  }
}