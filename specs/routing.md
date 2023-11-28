# H Protocol

This is the equivalent of the IP protocol on the normal internet.

An H packet contains the following

- (1 byte) version: 0
- (1 byte) hop limit: the remaining number of hops the packet can make
- (2 bytes) payload length
- (8 bytes) source address
- (8 bytes) destination address
- ("length" bytes) data

## Formatting addresses

H addresses can be written as any number of the segments seperated by dots.

All of the following are equivalent ways to write `0.0.0.0.0.0.0.1`

```
0.0.0.0.0.0.0.1
0.0.0.1
0.1
000.01
1
```

## Reserved addresses

WIP
