import { HPClient } from "@anbcodes/hackernet";
import { createInterface } from 'readline';

const rl = createInterface(
  {
    input: process.stdin,
    output: process.stdout,
    prompt: '>',
  }
)

rl.prompt();

const client = new HPClient(process.argv[2], 'localhost');

client.send('0', new Uint8Array());

client.on('packet', (packet) => {
  console.log(`\x1b[G${packet.source.join('.')}: ${new TextDecoder().decode(packet.data)}`);
  rl.prompt();
});


rl.on('line', (line) => {
  const data = new TextEncoder().encode(line);

  client.send(process.argv[3], data);

  rl.prompt();
});