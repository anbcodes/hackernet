process.stdout.write('\x00') // Version
process.stdout.write('\x09') // Hop limit
process.stdout.write('\x00\x0c') // Payload length
process.stdout.write('\x00\x00\x00\x00\x00\x00\x00\x01') // Source address
process.stdout.write('\x00\x00\x00\x00\x00\x00\x00\x02') // Dest address
process.stdout.write('Hello World\n'); // Payload
