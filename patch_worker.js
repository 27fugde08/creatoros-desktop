const fs = require('fs');
let code = fs.readFileSync('local-worker.ts', 'utf8');

const parseCode = `
  let redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const match = redisUrl.match(/(rediss?:\\/\\/[^\\s"'']+)/);
    if (match) {
      let extracted = match[1];
      if (redisUrl.includes("--tls") && extracted.startsWith("redis://")) {
        extracted = extracted.replace("redis://", "rediss://");
      }
      redisUrl = extracted;
    }
  }
`;

code = code.replace("const redisUrl = process.env.REDIS_URL;", parseCode.trim());
fs.writeFileSync('local-worker.ts', code);
