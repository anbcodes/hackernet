import dgram from 'node:dgram';

/**
 * Stores an Hacker Protocol Packet
 */
export interface HPPacket {
  version: number;
  hoplimit: number;
  payload: number;
  source: Uint8Array;
  dest: Uint8Array;
  data: Uint8Array;
}

/**
 * Encodes an Hacker Protocol Packet into a Uint8Array
 * @param packet The packet to encode 
 * @returns The encoded packet as a Uint8Array
 */
export function encodePacket(packet: HPPacket): Uint8Array {
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

/**
 * Decodes an Hacker Protocol Packet from a Uint8Array
 * @param buf The buffer to decode from
 * @returns The decoded packet
 */
export function decodePacket(buf: Uint8Array): HPPacket {
  const version = buf[0];
  const hoplimit = buf[1];
  const payload = (buf[2] << 8) | buf[3];
  const source = buf.slice(4, 12);
  const dest = buf.slice(12, 20);
  const data = buf.slice(20, 20 + payload);

  if (20 + payload > buf.length) {
    throw new Error(`Message is too small ${buf.length} vs. ${20 + payload}`);
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

/**
 * Parses an HP address string into a Uint8Array
 * @param addr The address to parse
 * @returns The parsed address
 */
export function parseAddress(addr: string) {
  const parts = addr.split('.');
  const addrBuf = new Uint8Array(8);
  addrBuf.set(parts.map((part) => parseInt(part, 10)), 8 - parts.length);
  return addrBuf;
}

/**
 * Parses an HP subnet string (like 0.0.0.0/24) into a Subnet
 * @param subnet The subnet to parse
 * @returns The parsed subnet
 */
export function parseSubnet(subnet: string) {
  const [addr, mask] = subnet.split('/');
  return {
    address: parseAddress(addr),
    mask: parseInt(mask, 10),
  };
}

/**
 * Checks if an address is within a subnet
 * @param addr The address to check
 * @param subnet The subnet to check
 * @returns Whether the address is within the subnet
 */
export function withinSubnet(addr: Uint8Array, { address: subnet, mask }: Subnet) {
  const bytes = Math.floor(mask / 8);
  for (let i = 0; i < bytes; i++) {
    if (addr[i] !== subnet[i]) {
      return false;
    }
  }

  const n = (mask % 8);
  const bitmask = ((1 << n) - 1) << (8 - n)
  if ((addr[bytes] & bitmask) !== (subnet[bytes] & bitmask)) {
    return false;
  }

  return true;
}

/**
 * Checks if two addresses are equal
 * @param a The first address
 * @param b The second address
 * @returns Whether the addresses are equal
 */
export function addrEquals(a: undefined | Uint8Array, b: undefined | Uint8Array) {
  if (!a || !b) {
    return false;
  }

  return a.every((byte, i) => byte === b[i]);
}

/**
 * Stores a route for the routing array
 */
export interface Route {
  subnet: Subnet;
  rinfo: dgram.RemoteInfo;
}

/**
 * Stores a subnet
 */
export interface Subnet {
  address: Uint8Array;
  mask: number;
}

export type HPErrorCode = "NO_ROUTE_TO_HOST";

/**
 * An error thrown by the HP library
 */
export class HPError extends Error {
  public code: HPErrorCode;

  constructor(code: HPErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * An Hacker Protocol Server
 */
export class HPServer {
  public socket: dgram.Socket;
  public port: number;
  public hpAddress: Uint8Array;
  public routes: Route[] = [];

  private listeners: {
    allPackets: ((packet: HPPacket, rinfo: dgram.RemoteInfo) => void)[];
    packet: ((packet: HPPacket, rinfo: dgram.RemoteInfo) => void)[];
  } = {
      allPackets: [],
      packet: [],
    };

  /**
   * Creates a new Hacker Protocol Server
   * @param hpAddress the HP address of the server
   * @param port the port to listen on (defaults to 13337)
   * @param host the host to bind to (defaults to localhost)
   */
  constructor(hpAddress: Uint8Array | string, port: number = 13337, host: string = 'localhost') {
    this.port = port;
    this.hpAddress = typeof hpAddress === 'string' ? parseAddress(hpAddress) : hpAddress;
    this.socket = dgram.createSocket('udp4');
    this.socket.on('message', this.handleMessage.bind(this));
    this.socket.bind(port, host);
  }

  /**
   * Adds a route to the routing table
   * @param subnet the subnet to add
   * @param rinfo the rinfo of the receiver
  */
  public addRoute(subnet: Subnet, rinfo: dgram.RemoteInfo) {
    this.routes.push({ subnet, rinfo });
  }

  /**
   * Adds multiple routes to the routing table
   * @param routes the routes to add
   */
  public addRoutes(routes: Route[]) {
    this.routes.push(...routes);
  }

  /**
   * Gets the route for a given address
   * @param addr the address to get the route for
   * @returns the route for the address
   */
  public getRoute(addr: Uint8Array) {
    return this.routes.find((route) => withinSubnet(addr, route.subnet));
  }

  /**
   * Handles a message received by the server
   * @param msg the message received
   * @param rinfo the rinfo of the sender
   */
  private handleMessage(msg: Buffer, rinfo: dgram.RemoteInfo) {
    const packet = decodePacket(msg);
    if (!this.getRoute(packet.source)) {
      this.addRoute({
        address: packet.source,
        mask: 64,
      }, rinfo);
    }

    this.listeners.allPackets.forEach((listener) => listener(packet, rinfo));

    if (addrEquals(packet.dest, this.hpAddress)) {
      this.listeners.packet.forEach((listener) => listener(packet, rinfo));
    }
  }

  /**
   * Sends data to a given address
   * @param to the address to send the packet to
   * @param data the data to send
   * @param options any additional options. See HPPacket.
   */
  public send(to: Uint8Array, data: Uint8Array, options: Partial<HPPacket> = {}) {
    const packet = {
      version: 1,
      hoplimit: 10,
      payload: data.length,
      source: this.hpAddress,
      dest: to,
      data,
      ...options,
    };

    this.sendPacket(packet);
  }

  /**
   * Sends a packet
   * @param packet the packet to send
   */
  public sendPacket(packet: HPPacket) {
    const route = this.getRoute(packet.dest);
    if (!route) {
      throw new HPError("NO_ROUTE_TO_HOST", "No route to host");
    }

    const buf = encodePacket(packet);

    this.socket.send(buf, route.rinfo.port, route.rinfo.address);
  }

  /**
   * Adds a listener for a given event
   * @param event the event to listen for
   * @param listener the listener to add
   */
  public on(event: 'packet' | 'allPackets', listener: (packet: HPPacket, rinfo: dgram.RemoteInfo) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(listener);
  }
}

/**
 * An Hacker Protocol Client
 */
export class HPClient {
  public socket: dgram.Socket;
  public hpAddress: Uint8Array;

  private listeners: {
    allPackets: ((packet: HPPacket, rinfo: dgram.RemoteInfo) => void)[];
    packet: ((packet: HPPacket, rinfo: dgram.RemoteInfo) => void)[];
  } = {
      allPackets: [],
      packet: [],
    };

  /**
   * Creates a new Hacker Protocol Client
   * @param hpAddress the HP address of the client
   * @param serverAddr the address of the server
   * @param serverPort the port of the server (defaults to 13337)
  */
  constructor(hpAddress: Uint8Array | string, public serverAddr: string, public serverPort: number = 13337) {
    this.hpAddress = typeof hpAddress === 'string' ? parseAddress(hpAddress) : hpAddress;
    this.socket = dgram.createSocket('udp4');
    this.socket.on('message', this.handleMessage.bind(this));
  }

  private handleMessage(msg: Buffer, rinfo: dgram.RemoteInfo) {
    const packet = decodePacket(msg);
    this.listeners.allPackets.forEach((listener) => listener(packet, rinfo));

    if (addrEquals(packet.dest, this.hpAddress)) {
      this.listeners.packet.forEach((listener) => listener(packet, rinfo));
    }
  }

  /**
   * Sends data to a given address
   * @param to the address to send the packet to
   * @param data the data to send
   * @param options any additional options. See HPPacket.
   */
  public send(to: Uint8Array | string, data: Uint8Array, options: Partial<HPPacket> = {}) {
    const packet = {
      version: 1,
      hoplimit: 10,
      payload: data.length,
      source: this.hpAddress,
      dest: to instanceof Uint8Array ? to : parseAddress(to),
      data,
      ...options,
    };

    this.sendPacket(packet);
  }

  /**
   * Sends a packet
   * @param packet the packet to send
   */
  public sendPacket(packet: HPPacket) {
    const buf = encodePacket(packet);

    this.socket.send(buf, this.serverPort, this.serverAddr);
  }

  /**
   * Adds a listener for a given event
   * @param event the event to listen for
   * @param listener the listener to add
   */
  public on(event: 'packet' | 'allPackets', listener: (packet: HPPacket, rinfo: dgram.RemoteInfo) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(listener);
  }
}