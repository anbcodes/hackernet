import { HPClient } from "@anbcodes/hackernet";

const client = new HPClient('0.1', 'localhost');

client.send('0.0', new TextEncoder().encode('Hello, world!'));

client.on('packet', (packet) => {
  console.log("Received", packet);
  console.log("Data", new TextDecoder().decode(packet.data));
})