# Routing Protocol

This is the equivalent of the IP protocol on the normal internet.

An RP packet contains the following

- (1 byte) version: 0
- (1 byte) hop limit: the remaining number of hops the packet can make
- (2 bytes) payload length
- (8 bytes) source address
- (8 bytes) destination address
- ("length" bytes) data

## Reserved addresses

WIP
