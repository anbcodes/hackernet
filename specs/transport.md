# Transport spec

There are two transport protocols: Hacker Datagram Protocol (connectionless) and
Hacker Connection Protocol (connection oriented). The first is like UDP and the
second is like TCP.

## Hacker Datagram Protocol (HDP)

The connectionless protocol sends packets formatted like the following

- (1 byte) packet type = 1 for connectionless
- (2 bytes) source port
- (2 bytes) dest port
- (2 bytes) data length
- (2 bytes) checksum of the sourceIP+destIP+thisPacket
- (n bytes) data

## Hacker Connection Protocol (HCP)

Header

- (1 byte) packet type = 2 for connection based
- (2 bytes) source port
- (2 bytes) dest port
- (2 bytes) data length
- (2 bytes) checksum of the sourceIP+destIP+thisPacket
- (2 bytes) sequence number
- (1 bit) ACKnowledge bit
- (1 bit) CONnect bit
- (1 bit) FINish bit
- (5 bits) reserved
