let running = false;
const q = [];

export function queue(task) {
  q.push(task);
  run();
}

async function run() {
  if (running || q.length === 0) return;
  running = true;
  const job = q.shift();
  await job();
  running = false;
  run();
}