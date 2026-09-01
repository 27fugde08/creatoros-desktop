import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Database,
  Table,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  Play,
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive,
  Cpu,
  Layers,
  FileCode,
  Terminal,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  PlusCircle,
  Zap,
  Info,
  ShieldCheck,
  Code
} from "lucide-react";
import { soundSynth } from "../utils/audioUtils";

interface TableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

interface TableInfo {
  name: string;
  rowCount: number;
  columns: TableColumn[];
  database: string;
}

interface DbStats {
  name: string;
  filePath: string;
  exists: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  tableCount: number;
  tables: string[];
  journalMode: string;
}

export const DatabaseExplorerTab: React.FC = () => {
  // State
  const [selectedDb, setSelectedDb] = useState<string>("creatoros_state.db");
  const [dbStats, setDbStats] = useState<Record<string, DbStats>>({});
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("dag_checkpoints");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Table Data State
  const [tableData, setTableData] = useState<{
    columns: TableColumn[];
    rows: any[];
    primaryKeyColumn: string;
    pagination: {
      page: number;
      pageSize: number;
      totalRows: number;
      totalPages: number;
    };
  }>({
    columns: [],
    rows: [],
    primaryKeyColumn: "id",
    pagination: { page: 1, pageSize: 25, totalRows: 0, totalPages: 1 },
  });

  // Query & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // Mode: 'grid' (Table Explorer) vs 'sql' (SQL Query Console)
  const [viewMode, setViewMode] = useState<"grid" | "sql">("grid");

  // SQL Console State
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM dag_checkpoints ORDER BY updated_at DESC LIMIT 50;");
  const [sqlResult, setSqlResult] = useState<{
    rows: any[];
    columns: string[];
    durationMs: number;
    rowCount: number;
  } | null>(null);
  const [sqlRunning, setSqlRunning] = useState<boolean>(false);
  const [sqlError, setSqlError] = useState<string | null>(null);

  // Modal / Inspection States
  const [inspectingRow, setInspectingRow] = useState<any | null>(null);
  const [jsonModalContent, setJsonModalContent] = useState<{ title: string; json: any } | null>(null);
  const [isMockModalOpen, setIsMockModalOpen] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mock Checkpoint Form State
  const [mockForm, setMockForm] = useState({
    pipelineId: `dag_manual_${Date.now().toString().slice(-4)}`,
    nodeId: "step_demucs_isolation",
    status: "completed",
    durationMs: 1450.0,
    artifacts: JSON.stringify({
      vocal_track: "temp/cache/vocal_custom.wav",
      bgm_track: "temp/cache/bgm_isolated.wav",
      vram_peak_mb: 2850,
      notes: "Manual Checkpoint from Database Explorer"
    }, null, 2)
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch DB Stats
  const fetchDbStats = useCallback(async () => {
    try {
      const res = await fetch("/api/db/stats");
      const data = await res.json();
      if (data.success) {
        setDbStats(data.data);
      }
    } catch (err: any) {
      console.error("Lỗi fetch DB stats:", err);
    }
  }, []);

  // 2. Fetch Tables List
  const fetchTables = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/db/tables?db=${encodeURIComponent(selectedDb)}`);
      const data = await res.json();
      if (data.success) {
        setTables(data.data);
        if (data.data.length > 0) {
          const currentTableExists = data.data.some((t: TableInfo) => t.name === selectedTable);
          if (!currentTableExists) {
            setSelectedTable(data.data[0].name);
          }
        }
      } else {
        setError(data.message || "Không thể tải danh sách bảng SQLite.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối API.");
    }
  }, [selectedDb, selectedTable]);

  // 3. Fetch Table Rows
  const fetchTableData = useCallback(async (page = 1) => {
    if (!selectedTable) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        db: selectedDb,
        page: page.toString(),
        pageSize: tableData.pagination.pageSize.toString(),
        search: searchQuery,
        sortOrder: sortOrder
      });

      if (sortBy) params.append("sortBy", sortBy);
      if (filterColumn && filterValue) {
        params.append("filterColumn", filterColumn);
        params.append("filterValue", filterValue);
      }

      const res = await fetch(`/api/db/table/${encodeURIComponent(selectedTable)}?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setTableData({
          columns: data.data.columns,
          rows: data.data.rows,
          primaryKeyColumn: data.data.primaryKeyColumn,
          pagination: data.data.pagination,
        });
      } else {
        setError(data.message || "Lỗi truy vấn dữ liệu bảng.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi mạng khi tải dòng dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [selectedDb, selectedTable, tableData.pagination.pageSize, searchQuery, sortBy, sortOrder, filterColumn, filterValue]);

  // Initial load & when selected DB/Table changes
  useEffect(() => {
    fetchDbStats();
    fetchTables();
  }, [selectedDb, fetchDbStats, fetchTables]);

  useEffect(() => {
    if (viewMode === "grid") {
      fetchTableData(1);
    }
  }, [selectedTable, fetchTableData, viewMode]);

  // Handle Delete Row
  const handleDeleteRow = async (row: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const pkCol = tableData.primaryKeyColumn;
    const pkVal = row[pkCol];

    if (pkVal === undefined) {
      alert("Không tìm thấy giá trị khóa chính của dòng.");
      return;
    }

    const confirmMsg = `Bạn có chắc chắn muốn xoá dòng [${pkCol} = "${pkVal}"] khỏi bảng '${selectedTable}'?`;
    if (!window.confirm(confirmMsg)) return;

    soundSynth.playSfx("pop");

    try {
      const res = await fetch("/api/db/row/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableName: selectedTable,
          criteria: { [pkCol]: pkVal },
          db: selectedDb,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`🗑️ Đã xoá thành công dòng [${pkVal}]`);
        fetchTableData(tableData.pagination.page);
        fetchTables();
        fetchDbStats();
      } else {
        alert(data.message || "Lỗi khi xoá dòng.");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi kết nối khi xoá.");
    }
  };

  // Handle Clear Table
  const handleClearTable = async () => {
    const confirmMsg = `⚠️ CẢNH BÁO: Hành động này sẽ xoá TOÀN BỘ dữ liệu trong bảng '${selectedTable}' trên cơ sở dữ liệu '${selectedDb}'. Bạn có chắc chắn muốn tiếp tục?`;
    if (!window.confirm(confirmMsg)) return;

    soundSynth.playSfx("whoosh");

    try {
      const res = await fetch("/api/db/table/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableName: selectedTable,
          db: selectedDb,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`🧹 Đã làm rỗng bảng '${selectedTable}' (${data.data.clearedRows} dòng đã dọn dẹp).`);
        fetchTableData(1);
        fetchTables();
        fetchDbStats();
      } else {
        alert(data.message || "Lỗi khi dọn bảng.");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi mạng khi dọn bảng.");
    }
  };

  // Handle Execute SQL Query
  const handleRunSqlQuery = async () => {
    if (!sqlQuery.trim()) return;
    setSqlRunning(true);
    setSqlError(null);
    soundSynth.playSfx("pop");

    try {
      const res = await fetch("/api/db/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sql: sqlQuery,
          db: selectedDb,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSqlResult({
          rows: data.data.rows,
          columns: data.data.columns,
          durationMs: data.data.durationMs,
          rowCount: data.data.rowCount,
        });
        showToast(`⚡ Thực thi thành công: ${data.data.rowCount} dòng (${data.data.durationMs}ms)`);
      } else {
        setSqlError(data.message || "Lỗi cú pháp hoặc quyền thực thi SQL.");
      }
    } catch (err: any) {
      setSqlError(err.message || "Lỗi kết nối khi chạy câu lệnh.");
    } finally {
      setSqlRunning(false);
    }
  };

  // Handle Vacuum DB
  const handleVacuumDb = async () => {
    soundSynth.playSfx("whoosh");
    try {
      const res = await fetch("/api/db/vacuum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ db: selectedDb }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("⚡ Đã tối ưu hóa VACUUM & thu gọn SQLite thành công!");
        fetchDbStats();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Inject Mock Checkpoint
  const handleInjectMockCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    soundSynth.playSfx("pop");

    let parsedArtifacts = {};
    try {
      parsedArtifacts = JSON.parse(mockForm.artifacts);
    } catch (err) {
      alert("Cú pháp Artifacts JSON không hợp lệ.");
      return;
    }

    try {
      const res = await fetch("/api/db/dag/mock-checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineId: mockForm.pipelineId,
          nodeId: mockForm.nodeId,
          status: mockForm.status,
          artifacts: parsedArtifacts,
          durationMs: Number(mockForm.durationMs),
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`♻️ Đã tiêm Checkpoint mẫu [${mockForm.pipelineId}]`);
        setIsMockModalOpen(false);
        fetchTableData(1);
        fetchTables();
        fetchDbStats();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Export Table Data to JSON
  const handleExportJson = () => {
    soundSynth.playSfx("whoosh");
    const jsonStr = JSON.stringify(tableData.rows, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTable}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`📥 Đã xuất ${tableData.rows.length} dòng thành tệp JSON.`);
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    soundSynth.playSfx("pop");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Format cell value helper
  const formatCellValue = (val: any, colName: string) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-600 italic font-mono text-[11px]">NULL</span>;
    }

    // Check if JSON
    if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
      try {
        const parsed = JSON.parse(val);
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setJsonModalContent({ title: colName, json: parsed });
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono transition-all cursor-pointer truncate max-w-[200px]"
          >
            <FileCode className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="truncate">{val.slice(0, 30)}...</span>
          </button>
        );
      } catch (e) {
        // Not valid JSON, continue normal rendering
      }
    }

    // Status badges
    if (colName.toLowerCase().includes("status")) {
      const s = String(val).toUpperCase();
      let colorClass = "bg-slate-800 text-slate-300 border-slate-700";
      if (s === "COMPLETED" || s === "SUCCESS" || s === "PASSED") {
        colorClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      } else if (s === "RUNNING" || s === "PROCESSING") {
        colorClass = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse";
      } else if (s === "FAILED" || s === "ERROR") {
        colorClass = "bg-red-500/20 text-red-300 border-red-500/40";
      } else if (s === "QUEUED" || s === "PENDING") {
        colorClass = "bg-amber-500/20 text-amber-300 border-amber-500/40";
      }
      return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colorClass}`}>
          {String(val)}
        </span>
      );
    }

    // Timestamps
    if ((colName.includes("_at") || colName.includes("At") || colName === "timestamp") && typeof val === "number") {
      const dateVal = val > 10000000000 ? new Date(val) : new Date(val * 1000);
      return (
        <span className="text-slate-300 font-mono text-[11px]" title={dateVal.toISOString()}>
          {dateVal.toLocaleString("vi-VN")}
        </span>
      );
    }

    // Booleans
    if (typeof val === "boolean" || val === 1 || val === 0) {
      if (colName.startsWith("is_") || colName.startsWith("has_") || colName.includes("active")) {
        const isTrue = Boolean(val);
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isTrue ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-slate-900 text-slate-500 border border-slate-800"}`}>
            {isTrue ? "TRUE" : "FALSE"}
          </span>
        );
      }
    }

    return <span className="text-slate-200 text-[11px] truncate max-w-[250px] inline-block">{String(val)}</span>;
  };

  const activeStats = dbStats[selectedDb];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white text-xs font-bold border border-indigo-500/50 shadow-2xl flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner & Live SQLite Telemetry */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Database Explorer & DAG State Inspector</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  SQLite WAL ACID
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Truy vấn, kiểm duyệt, dọn dẹp và chẩn đoán thủ công trạng thái Checkpoint của DAG Scheduler & Pipelines.
              </p>
            </div>
          </div>

          {/* DB Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  soundSynth.playSfx("pop");
                  setSelectedDb("creatoros_state.db");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDb === "creatoros_state.db"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                creatoros_state.db (DAG)
              </button>

              <button
                onClick={() => {
                  soundSynth.playSfx("pop");
                  setSelectedDb("database.sqlite");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDb === "database.sqlite"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                database.sqlite (Sequelize)
              </button>
            </div>

            <button
              onClick={() => setIsMockModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
              title="Tiêm Checkpoint mẫu để kiểm thử DAG Auto-Resume"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tiêm Checkpoint Mẫu</span>
            </button>

            <button
              onClick={handleVacuumDb}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
              title="Thu nhỏ và chống phân mảnh SQLite (VACUUM)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Tối Ưu DB (VACUUM)</span>
            </button>

            <button
              onClick={() => {
                fetchDbStats();
                fetchTables();
                if (viewMode === "grid") fetchTableData(tableData.pagination.page);
                soundSynth.playSfx("pop");
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
              title="Làm mới toàn bộ dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Telemetry Badges */}
        {activeStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Kích Thước Tệp DB</div>
                <div className="text-xs font-mono font-bold text-white">{activeStats.sizeFormatted}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <Table className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Tổng Số Bảng</div>
                <div className="text-xs font-mono font-bold text-emerald-400">{activeStats.tableCount} Bảng dữ liệu</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Nhật Ký Giao Dịch</div>
                <div className="text-xs font-mono font-bold text-purple-300 uppercase">{activeStats.journalMode} Mode</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 truncate">
              <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-slate-400 font-semibold">Vị Trí Lưu Trữ</div>
                <div className="text-[11px] font-mono text-slate-300 truncate" title={activeStats.filePath}>
                  {activeStats.filePath.split("/").pop() || activeStats.filePath.split("\\").pop()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mode Switcher: Table Grid Explorer vs SQL Console */}
      <div className="flex items-center justify-between p-1 bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              soundSynth.playSfx("pop");
              setViewMode("grid");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Trình Khám Phá Bảng (Table Grid Inspector)</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playSfx("pop");
              setViewMode("sql");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "sql"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>SQL Query Console (Truy Vấn Nâng Cao)</span>
          </button>
        </div>

        {viewMode === "grid" && (
          <div className="flex items-center gap-2 pr-2">
            <button
              onClick={handleExportJson}
              disabled={tableData.rows.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xuất JSON</span>
            </button>

            <button
              onClick={handleClearTable}
              disabled={tableData.rows.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold border border-red-800/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Làm Rỗng Bảng</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: TABLE GRID EXPLORER */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Sidebar: Tables List */}
          <div className="lg:col-span-3 space-y-2">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Danh Sách Bảng ({tables.length})
              </span>
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {tables.map((tbl) => {
                const isSelected = tbl.name === selectedTable;
                return (
                  <button
                    key={tbl.name}
                    onClick={() => {
                      soundSynth.playSfx("pop");
                      setSelectedTable(tbl.name);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-indigo-600/20 text-white border-indigo-500 shadow-md shadow-indigo-600/10"
                        : "bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Table className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} />
                      <span className="truncate font-mono">{tbl.name}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                      }`}
                    >
                      {tbl.rowCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Area: Grid, Filters, Table Display & Pagination */}
          <div className="lg:col-span-9 space-y-4">
            {/* Filter & Search Bar */}
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Tìm kiếm trong ${selectedTable}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchTableData(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 rounded-lg text-xs text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Column Filter Selection */}
              <div className="flex items-center gap-2">
                <select
                  value={filterColumn}
                  onChange={(e) => setFilterColumn(e.target.value)}
                  className="px-3 py-2 bg-slate-950 rounded-lg text-xs text-slate-300 border border-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Lọc theo cột --</option>
                  {tableData.columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {filterColumn && (
                  <input
                    type="text"
                    placeholder="Giá trị lọc..."
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") fetchTableData(1);
                    }}
                    className="w-32 px-3 py-2 bg-slate-950 rounded-lg text-xs text-white border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                )}

                <button
                  onClick={() => fetchTableData(1)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Lọc
                </button>
              </div>
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Data Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 text-[11px] font-bold sticky top-0 z-10">
                      <th className="p-3 w-12 text-center">#</th>
                      {tableData.columns.map((col) => (
                        <th
                          key={col.name}
                          onClick={() => {
                            if (sortBy === col.name) {
                              setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
                            } else {
                              setSortBy(col.name);
                              setSortOrder("DESC");
                            }
                            fetchTableData(1);
                          }}
                          className="p-3 font-mono cursor-pointer hover:text-white transition-colors select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{col.name}</span>
                            {col.pk === 1 && (
                              <span className="px-1 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] rounded font-bold">
                                PK
                              </span>
                            )}
                            <ArrowUpDown className="w-3 h-3 text-slate-600" />
                          </div>
                        </th>
                      ))}
                      <th className="p-3 w-24 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={tableData.columns.length + 2} className="p-10 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                          <span>Đang tải dữ liệu từ {selectedDb}...</span>
                        </td>
                      </tr>
                    ) : tableData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={tableData.columns.length + 2} className="p-10 text-center text-slate-500">
                          <Database className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                          <span>Bảng này hiện chưa có dữ liệu nào hoặc không khớp với bộ lọc.</span>
                        </td>
                      </tr>
                    ) : (
                      tableData.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          onClick={() => setInspectingRow(row)}
                          className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="p-3 text-center text-[10px] font-mono text-slate-500">
                            {(tableData.pagination.page - 1) * tableData.pagination.pageSize + rIdx + 1}
                          </td>
                          {tableData.columns.map((col) => (
                            <td key={col.name} className="p-3 text-xs">
                              {formatCellValue(row[col.name], col.name)}
                            </td>
                          ))}
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setInspectingRow(row)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                title="Xem chi tiết dòng"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteRow(row, e)}
                                className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300"
                                title="Xoá dòng này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span>
                    Hiển thị <strong>{tableData.rows.length}</strong> / <strong>{tableData.pagination.totalRows}</strong> dòng
                  </span>
                  <span className="text-slate-600">|</span>
                  <span>
                    Trang <strong>{tableData.pagination.page}</strong> / <strong>{tableData.pagination.totalPages}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => fetchTableData(tableData.pagination.page - 1)}
                    disabled={tableData.pagination.page <= 1}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => fetchTableData(tableData.pagination.page + 1)}
                    disabled={tableData.pagination.page >= tableData.pagination.totalPages}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: SQL QUERY CONSOLE */}
      {viewMode === "sql" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-indigo-400" />
                Soạn Thảo Câu Lệnh SQL (Target: {selectedDb})
              </span>

              {/* Quick SQL Snippets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-semibold mr-1">Mẫu Query:</span>
                {[
                  { label: "DAG Checkpoints", sql: "SELECT * FROM dag_checkpoints ORDER BY updated_at DESC LIMIT 50;" },
                  { label: "Pipelines Đang Chạy", sql: "SELECT * FROM pipelines WHERE status = 'RUNNING' LIMIT 20;" },
                  { label: "Kiểm Tra Integrity", sql: "PRAGMA integrity_check;" },
                ].map((snip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSqlQuery(snip.sql);
                      soundSynth.playSfx("pop");
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700 transition-all cursor-pointer"
                  >
                    {snip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={4}
                className="w-full p-3.5 bg-slate-950 rounded-xl font-mono text-xs text-indigo-200 border border-slate-800 focus:outline-none focus:border-indigo-500 resize-y leading-relaxed"
                placeholder="Nhập câu lệnh SELECT / PRAGMA..."
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                💡 Nhấn <strong>Thực Thi SQL</strong> để chạy câu lệnh an toàn (chỉ hỗ trợ SELECT/PRAGMA).
              </span>

              <button
                onClick={handleRunSqlQuery}
                disabled={sqlRunning || !sqlQuery.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${sqlRunning ? "animate-spin" : "fill-white"}`} />
                <span>{sqlRunning ? "Đang Thực Thi..." : "Thực Thi SQL (Execute)"}</span>
              </button>
            </div>
          </div>

          {/* SQL Error Banner */}
          {sqlError && (
            <div className="p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{sqlError}</span>
            </div>
          )}

          {/* SQL Results Grid */}
          {sqlResult && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl space-y-2">
              <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Kết quả: <strong>{sqlResult.rowCount}</strong> dòng trả về
                  </span>
                </div>
                <span className="font-mono text-indigo-400">Thời gian thực thi: {sqlResult.durationMs} ms</span>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px] font-bold sticky top-0">
                      <th className="p-3 w-10 text-center">#</th>
                      {sqlResult.columns.map((col) => (
                        <th key={col} className="p-3 font-mono">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sqlResult.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        onClick={() => setInspectingRow(row)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="p-3 text-center text-[10px] font-mono text-slate-500">{rIdx + 1}</td>
                        {sqlResult.columns.map((col) => (
                          <td key={col} className="p-3 text-xs">
                            {formatCellValue(row[col], col)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ROW INSPECTOR LIGHTBOX */}
      {inspectingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[85vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Chi Tiết Bản Ghi ({selectedTable})</h3>
              </div>
              <button
                onClick={() => setInspectingRow(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {Object.entries(inspectingRow).map(([key, val]) => {
                let isJson = false;
                let parsedJson = null;

                if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
                  try {
                    parsedJson = JSON.parse(val);
                    isJson = true;
                  } catch (e) {}
                }

                return (
                  <div key={key} className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-300">{key}</span>
                      <button
                        onClick={() => copyToClipboard(String(val), key)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
                      >
                        {copiedKey === key ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === key ? "Đã sao chép" : "Copy"}</span>
                      </button>
                    </div>

                    {isJson ? (
                      <pre className="p-2.5 rounded bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                        {JSON.stringify(parsedJson, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-xs text-slate-200 break-all font-mono">
                        {val === null || val === undefined ? <span className="text-slate-600 italic">NULL</span> : String(val)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingRow(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: JSON VIEWER MODAL */}
      {jsonModalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[85vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">JSON Inspector: {jsonModalContent.title}</h3>
              </div>
              <button
                onClick={() => setJsonModalContent(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <pre className="p-4 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                {JSON.stringify(jsonModalContent.json, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => copyToClipboard(JSON.stringify(jsonModalContent.json, null, 2), "json_modal")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao Chép JSON</span>
              </button>

              <button
                onClick={() => setJsonModalContent(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INJECT MOCK CHECKPOINT FOR TESTING */}
      {isMockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Tiêm Checkpoint DAG Mẫu (State Injection)</h3>
              </div>
              <button onClick={() => setIsMockModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInjectMockCheckpoint} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Pipeline ID Định Danh:</label>
                <input
                  type="text"
                  value={mockForm.pipelineId}
                  onChange={(e) => setMockForm({ ...mockForm, pipelineId: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-950 rounded-lg text-white font-mono border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">DAG Node Cần Lưu:</label>
                  <select
                    value={mockForm.nodeId}
                    onChange={(e) => setMockForm({ ...mockForm, nodeId: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 rounded-lg text-white font-mono border border-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="step_ingest_hash">1. Ingest & SHA-256</option>
                    <option value="step_demucs_isolation">2. Demucs Stem Isolation</option>
                    <option value="step_whisper_transcription">3. Whisper Subtitles</option>
                    <option value="step_rag_qc_audit">4. Vector RAG & QC</option>
                    <option value="step_nvenc_render">5. NVENC Render</option>
                    <option value="step_matrix_dispatch">6. Matrix Dispatch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Trạng Thái Checkpoint:</label>
                  <select
                    value={mockForm.status}
                    onChange={(e) => setMockForm({ ...mockForm, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 rounded-lg text-white font-mono border border-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="completed">COMPLETED</option>
                    <option value="running">RUNNING</option>
                    <option value="failed">FAILED</option>
                    <option value="pending">PENDING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Artifacts Output JSON:</label>
                <textarea
                  value={mockForm.artifacts}
                  onChange={(e) => setMockForm({ ...mockForm, artifacts: e.target.value })}
                  rows={4}
                  className="w-full p-2.5 bg-slate-950 rounded-lg text-emerald-300 font-mono border border-slate-800 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMockModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  Xác Nhận Tiêm Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
