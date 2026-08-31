import { useState, useEffect, useRef, useCallback } from "react";

export interface PingVramStats {
  vram_total_mb: number;
  vram_used_mb: number;
  vram_percent: number;
  gpu_name: string;
}

export interface PingCpuStats {
  cpu_percent: number;
  ram_percent: number;
  ram_used_mb: number;
  ram_total_mb: number;
}

export interface PingTelemetry {
  status: "online" | "offline" | "connecting";
  server_timestamp: number;
  server_time?: number;
  uptime_sec?: number;
  connected_clients?: number;
  vram?: PingVramStats;
  cpu?: PingCpuStats;
  hardware_telemetry?: any;
}

export interface ConnectionHealthState {
  isConnected: boolean;
  status: "connected" | "connecting" | "disconnected" | "reconnecting";
  latencyMs: number | null;
  lastPingTimestamp: number | null;
  serverTimestamp: number | null;
  telemetry: PingTelemetry | null;
  reconnectAttempts: number;
  nextRetrySec: number | null;
  wsUrl: string;
  errorMessage: string | null;
}

interface UseRealtimeConnectionOptions {
  wsUrl?: string;
  pingIntervalMs?: number; // Mặc định 5000ms (5 giây)
  pingTimeoutMs?: number; // Mặc định 3500ms
  initialBackoffMs?: number; // Mặc định 1000ms
  maxBackoffMs?: number; // Mặc định 30000ms (30s)
  autoConnect?: boolean;
}

export function useRealtimeConnection(options: UseRealtimeConnectionOptions = {}) {
  const {
    wsUrl = "ws://127.0.0.1:8765",
    pingIntervalMs = 5000,
    pingTimeoutMs = 3500,
    initialBackoffMs = 1500,
    maxBackoffMs = 25000,
    autoConnect = true,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionHealthState>({
    isConnected: false,
    status: "disconnected",
    latencyMs: null,
    lastPingTimestamp: null,
    serverTimestamp: null,
    telemetry: null,
    reconnectAttempts: 0,
    nextRetrySec: null,
    wsUrl,
    errorMessage: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<any>(null);
  const pingTimeoutRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const attemptsRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const pendingPingMapRef = useRef<Map<string | number, number>>(new Map());
  const rpcIdCounterRef = useRef<number>(1);

  // Clear all background timers
  const clearAllTimers = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Send JSON-RPC system.ping message
  const sendPing = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const currentRpcId = `ping_${rpcIdCounterRef.current++}_${Date.now()}`;
    const pingSendTime = performance.now();
    pendingPingMapRef.current.set(currentRpcId, pingSendTime);

    const rpcPayload = {
      jsonrpc: "2.0",
      method: "system.ping",
      params: {
        client: "React_Frontend_Dashboard",
        client_timestamp: Date.now(),
      },
      id: currentRpcId,
    };

    try {
      wsRef.current.send(JSON.stringify(rpcPayload));

      // Set timeout for this ping
      if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = setTimeout(() => {
        if (pendingPingMapRef.current.has(currentRpcId)) {
          pendingPingMapRef.current.delete(currentRpcId);
          // Ping timeout, consider connection unstable
          setConnectionState((prev) => ({
            ...prev,
            latencyMs: null,
            errorMessage: "Ping timeout (> 3.5s). Luồng WebSocket phản hồi chậm.",
          }));
        }
      }, pingTimeoutMs);
    } catch (err: any) {
      console.warn("[WS Ping] Send failed:", err);
    }
  }, [pingTimeoutMs]);

  // Handle incoming Pong / RPC response
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      const now = performance.now();

      // Check if it's a response to a pending system.ping
      if (msg && msg.id && pendingPingMapRef.current.has(msg.id)) {
        const sendTime = pendingPingMapRef.current.get(msg.id)!;
        pendingPingMapRef.current.delete(msg.id);
        if (pingTimeoutRef.current) {
          clearTimeout(pingTimeoutRef.current);
          pingTimeoutRef.current = null;
        }

        const calculatedLatency = Math.max(1, Math.round(now - sendTime));
        const result = msg.result || {};

        if (isMountedRef.current) {
          setConnectionState((prev) => ({
            ...prev,
            isConnected: true,
            status: "connected",
            latencyMs: calculatedLatency,
            lastPingTimestamp: Date.now(),
            serverTimestamp: result.server_timestamp ? result.server_timestamp * 1000 : Date.now(),
            telemetry: {
              status: result.status || "online",
              server_timestamp: result.server_timestamp || Date.now() / 1000,
              uptime_sec: result.uptime_sec,
              connected_clients: result.connected_clients,
              vram: result.vram,
              cpu: result.cpu,
              hardware_telemetry: result.hardware_telemetry,
            },
            errorMessage: null,
            nextRetrySec: null,
          }));
        }
      } else if (msg && (msg.type === "pong" || msg.method === "notify.bridge_ready")) {
        // Handshake or simple pong message
        if (isMountedRef.current) {
          setConnectionState((prev) => ({
            ...prev,
            isConnected: true,
            status: "connected",
            lastPingTimestamp: Date.now(),
            errorMessage: null,
          }));
        }
      }
    } catch (err) {
      // Ignored non-JSON or other event messages
    }
  }, []);

  // Connect WebSocket with Exponential Backoff
  const connect = useCallback(() => {
    clearAllTimers();

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }

    if (!isMountedRef.current) return;

    setConnectionState((prev) => ({
      ...prev,
      status: attemptsRef.current > 0 ? "reconnecting" : "connecting",
      errorMessage: null,
      nextRetrySec: null,
    }));

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        attemptsRef.current = 0;

        setConnectionState((prev) => ({
          ...prev,
          isConnected: true,
          status: "connected",
          reconnectAttempts: 0,
          nextRetrySec: null,
          errorMessage: null,
        }));

        // Send immediate initial ping
        sendPing();

        // Schedule periodic ping every 5 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (isMountedRef.current) {
            sendPing();
          }
        }, pingIntervalMs);
      };

      ws.onmessage = handleMessage;

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        // On error, the onclose will be triggered automatically
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        wsRef.current = null;
        clearAllTimers();

        // Calculate Exponential Backoff Delay
        attemptsRef.current += 1;
        const currentAttempt = attemptsRef.current;
        const backoffDelayMs = Math.min(
          initialBackoffMs * Math.pow(1.6, currentAttempt - 1) + Math.random() * 500,
          maxBackoffMs
        );
        let secondsLeft = Math.ceil(backoffDelayMs / 1000);

        setConnectionState((prev) => ({
          ...prev,
          isConnected: false,
          status: "disconnected",
          latencyMs: null,
          reconnectAttempts: currentAttempt,
          nextRetrySec: secondsLeft,
          errorMessage: "Mất kết nối Backend (Python WebSocket Server ngắt kết nối hoặc chưa khởi động)",
        }));

        // Countdown timer for user feedback
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
          if (!isMountedRef.current) return;
          secondsLeft -= 1;
          if (secondsLeft <= 0) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          } else {
            setConnectionState((prev) => ({ ...prev, nextRetrySec: secondsLeft }));
          }
        }, 1000);

        // Schedule next reconnect attempt
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, backoffDelayMs);
      };
    } catch (err: any) {
      console.warn("[WS] Connection initiation error:", err);
      if (isMountedRef.current) {
        setConnectionState((prev) => ({
          ...prev,
          isConnected: false,
          status: "disconnected",
          errorMessage: err?.message || "Lỗi khởi tạo kết nối WebSocket",
        }));
      }
    }
  }, [wsUrl, pingIntervalMs, initialBackoffMs, maxBackoffMs, clearAllTimers, sendPing, handleMessage]);

  // Manual Trigger Reconnect
  const reconnectNow = useCallback(() => {
    attemptsRef.current = 0;
    connect();
  }, [connect]);

  // Lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    if (autoConnect) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      clearAllTimers();
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
        wsRef.current = null;
      }
    };
  }, [autoConnect, connect, clearAllTimers]);

  return {
    ...connectionState,
    reconnectNow,
    sendPing,
  };
}
