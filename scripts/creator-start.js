const fs = require("fs");
const path = require("path");

function getPythonCmd() {
  const isWin = process.platform === "win32";
  const venvPathWin = path.join(__dirname, "..", ".venv", "Scripts", "python.exe");
  const venvPathUnix = path.join(__dirname, "..", ".venv", "bin", "python");
  
  if (isWin && fs.existsSync(venvPathWin)) return `"${venvPathWin}"`;
  if (!isWin && fs.existsSync(venvPathUnix)) return `"${venvPathUnix}"`;
  return isWin ? "python" : "python3";
}

const pythonCmd = getPythonCmd();
console.log(`[CreatorOS Boot] Auto-detected Python environment: ${pythonCmd}`);
console.log(`[CreatorOS Boot] Khởi động Native Desktop Mode (Python WS Bridge + Electron Native App)...`);

const { concurrently } = require("concurrently");

concurrently([
  {
    command: `${pythonCmd} python_core/py_ws_bridge.py --port 8765`,
    name: "PythonEngine",
    prefixColor: "green.bold"
  },
  {
    command: "npx electron electron/electron.cjs",
    name: "ElectronUI",
    prefixColor: "yellow.bold"
  }
], {
  prefix: "name",
  killOthers: ["failure", "success"],
  restartTries: 0
}).result.then(() => {
  console.log("[CreatorOS Boot] Tất cả dịch vụ Desktop đã đóng thành công.");
}).catch((err) => {
  // Bỏ qua lỗi ngắt tiến trình do người dùng đóng
});