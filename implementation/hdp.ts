import { HDPSocket } from '@anbcodes/hackernet';
import { createInterface } from 'readline';

const socket = new HDPSocket(process.argv[2], +process.argv[3], 13337, 'localhost');

const rl = createInterface(
  {
    input: process.stdin,
    output: process.stdout,
    prompt: '>',
  }
)

rl.prompt();

socket.onPacket((packet) => {
  console.log(`\x1b[G${packet.srcPort}: ${new TextDecoder().decode(packet.data)}`);
  rl.prompt();
})

rl.on('line', (line) => {
  const data = new TextEncoder().encode(line);

  socket.send(process.argv[4], +process.argv[3], data);

  rl.prompt();
});