const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    // Yêu cầu: Khởi động python script với tên được cấu hình qua biến môi trường
    try {
      const pyProcess = spawn("python3", [scriptName, item.url, "--no-watermark"]);

      pyProcess.stdout.on("data", (data: Buffer) => {
        const output = data.toString();
        // Bóc tách luồng % tiến độ
        const match = output.match(/(\\d+)%/);
        if (match) {
          const progress = parseInt(match[1], 10);
          io.emit("download_progress", { 
            id: item.id, 
            progress: Math.min(progress, 99), 
            status: "downloading" 
          });
        }
      });

      // Bọc an toàn khối stderr
      pyProcess.stderr.on("data", (data: Buffer) => {
        console.error(\`[Python Worker Error - \${item.videoId}]: \${data.toString()}\`);
      });

      pyProcess.on("close", (code: number) => {
        io.emit("download_progress", { 
          id: item.id, 
          progress: 100, 
          status: code === 0 ? "completed" : "error" 
        });
      });
      
      pyProcess.on("error", (err: Error) => {
        console.error(\`Failed to start python script \${scriptName}:\`, err);
        io.emit("download_progress", { id: item.id, progress: 100, status: "error" });
      });`;

const replacement = `    // Yêu cầu: Khởi động python script với tên được cấu hình qua biến môi trường
    try {
      /* [MOCK LOGIC] Đóng comment code gọi script thật theo yêu cầu
      const pyProcess = spawn("python3", [scriptName, item.url, "--no-watermark"]);

      pyProcess.stdout.on("data", (data: Buffer) => {
        const output = data.toString();
        // Bóc tách luồng % tiến độ
        const match = output.match(/(\\d+)%/);
        if (match) {
          const progress = parseInt(match[1], 10);
          io.emit("download_progress", { 
            id: item.id, 
            progress: Math.min(progress, 99), 
            status: "downloading" 
          });
        }
      });

      // Bọc an toàn khối stderr
      pyProcess.stderr.on("data", (data: Buffer) => {
        console.error(\`[Python Worker Error - \${item.videoId}]: \${data.toString()}\`);
      });

      pyProcess.on("close", (code: number) => {
        io.emit("download_progress", { 
          id: item.id, 
          progress: 100, 
          status: code === 0 ? "completed" : "error" 
        });
      });
      
      pyProcess.on("error", (err: Error) => {
        console.error(\`Failed to start python script \${scriptName}:\`, err);
        io.emit("download_progress", { id: item.id, progress: 100, status: "error" });
      });
      */

      // [MOCK LOGIC] Giả lập luồng tiến độ từ 0% -> 100% trong 4 giây
      let mockProgress = 0;
      const intervalMs = 400; // Cập nhật mỗi 400ms
      const step = 10; // Tăng 10% mỗi lần (Tổng 10 lần = 4000ms = 4 giây)

      const interval = setInterval(() => {
        mockProgress += step;
        
        if (mockProgress >= 100) {
          clearInterval(interval);
          io.emit("download_progress", { 
            id: item.id, 
            progress: 100, 
            status: "completed" 
          });
        } else {
          io.emit("download_progress", { 
            id: item.id, 
            progress: mockProgress, 
            status: "downloading" 
          });
        }
      }, intervalMs);`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Successfully patched server.ts");
} else {
    console.error("Target string not found!");
}
