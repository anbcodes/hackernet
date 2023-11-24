# Routing Protocol

This is the equivalent of the IP protocol on the normal internet.

An RP packet contains the following

- Version (1 byte): the RP version, for now its just 1
- Source (8 bytes): the source address
- Dest (8 bytes): the destination address
- TTL (1 byte): the time to live (prevents infinite loops)
- Length (2 bytes): the length of the data in bytes
- Data: the data

## Reserved addresses

WIP
