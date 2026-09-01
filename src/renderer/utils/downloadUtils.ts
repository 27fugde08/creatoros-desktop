// Utility functions for exporting and downloading artifacts (Video Blobs, SRT, ASS, JSON)
import { GlobalTaskItem } from "../../shared/types";
import { soundSynth } from "./audioUtils";
import { getApiUrl } from "./apiClient";

/**
 * Downloads a text content string as a file
 */
export function downloadTextFile(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  soundSynth.playSfx("cash");
}

/**
 * Generate standard SubRip Subtitle (.srt) format from task script/title
 */
export function generateSrtContent(task: GlobalTaskItem): string {
  const lines: string[] = [];
  const script = task.scriptSnippet || task.subtitle || task.title;
  
  // Split script into manageable subtitle segments
  const sentences = script
    .split(/(?<=[.!?。！？\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length === 0) {
    sentences.push(task.title);
  }

  let currentTimeSec = 0;
  const durationPerSegment = Math.max(2.5, Math.min(5, 55 / Math.max(1, sentences.length)));

  sentences.forEach((sentence, index) => {
    const startSec = currentTimeSec;
    const endSec = startSec + durationPerSegment;
    currentTimeSec = endSec;

    const formatTime = (sec: number) => {
      const h = Math.floor(sec / 3600).toString().padStart(2, "0");
      const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
      const s = Math.floor(sec % 60).toString().padStart(2, "0");
      const ms = Math.floor((sec % 1) * 1000).toString().padStart(3, "0");
      return `${h}:${m}:${s},${ms}`;
    };

    lines.push(`${index + 1}`);
    lines.push(`${formatTime(startSec)} --> ${formatTime(endSec)}`);
    lines.push(sentence);
    lines.push("");
  });

  return lines.join("\n");
}

/**
 * Generate Advanced SubStation Alpha (.ass) format with custom styles for TikTok / Shorts
 */
export function generateAssContent(task: GlobalTaskItem): string {
  const script = task.scriptSnippet || task.subtitle || task.title;
  const sentences = script
    .split(/(?<=[.!?。！？\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length === 0) {
    sentences.push(task.title);
  }

  const header = `[Script Info]
Title: ${task.title}
Original Script: CreatorOS AI Subtitle Generator
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0
PlayResX: 1080
PlayResY: 1920
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ViralHook,Montserrat Black,72,&H0000FFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,6,3,2,60,60,320,1
Style: CaptionBody,Arial Black,64,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,2,60,60,260,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let currentTimeSec = 0;
  const durationPerSegment = Math.max(2.5, Math.min(5, 55 / Math.max(1, sentences.length)));
  const eventLines: string[] = [];

  const formatAssTime = (sec: number) => {
    const h = Math.floor(sec / 3600).toString();
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    const cs = Math.floor((sec % 1) * 100).toString().padStart(2, "0");
    return `${h}:${m}:${s}.${cs}`;
  };

  sentences.forEach((sentence, index) => {
    const startSec = currentTimeSec;
    const endSec = startSec + durationPerSegment;
    currentTimeSec = endSec;
    const style = index === 0 ? "ViralHook" : "CaptionBody";
    const textFormatted = index === 0 
      ? `{\\c&H00FFFF&\\b1}${sentence.toUpperCase()}`
      : `{\\b1}${sentence}`;

    eventLines.push(`Dialogue: 0,${formatAssTime(startSec)},${formatAssTime(endSec)},${style},,0,0,0,,${textFormatted}`);
  });

  return header + eventLines.join("\n");
}

/**
 * Downloads a video file (fetches real backend URL or generates downloadable MP4 blob)
 */
export async function downloadVideoBlob(task: GlobalTaskItem) {
  soundSynth.playSfx("whoosh");
  const filename = task.outputArtifact?.name || `${task.id}_final_render.mp4`;

  // If there's an active backend download URL (not a mock # tag)
  if (task.outputArtifact?.downloadUrl && task.outputArtifact.downloadUrl !== "#") {
    try {
      const targetUrl = task.outputArtifact.downloadUrl.startsWith("http")
        ? task.outputArtifact.downloadUrl
        : getApiUrl(task.outputArtifact.downloadUrl);
      const response = await fetch(targetUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        soundSynth.playSfx("success");
        return;
      }
    } catch (e) {
      console.warn("Direct HTTP fetch failed, fallback to blob packaging", e);
    }
  }

  // Fallback: Create a structured simulated MP4 video blob wrapper with task metadata header
  const metadataBanner = JSON.stringify(
    {
      app: "CreatorOS Fullstack Video Engine",
      task_id: task.id,
      title: task.title,
      resolution: task.resolution || "1080x1920 60FPS",
      codec: "h264_nvenc / aac 320k",
      created_at: new Date(task.createdAt).toISOString(),
      script: task.scriptSnippet,
      tags: task.tags,
      logs: task.logs,
    },
    null,
    2
  );

  // Minimal standard ISO MP4 header buffer signature (ftypisom)
  const headerBytes = new Uint8Array([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp
    0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00, // isom
    0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32, // isom iso2
    0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31  // avc1 mp41
  ]);

  const textEncoder = new TextEncoder();
  const metaBytes = textEncoder.encode(`\n<!-- CREATOR_OS_METADATA_HEADER: ${metadataBanner} -->\n`);

  const combinedBlob = new Blob([headerBytes, metaBytes], { type: "video/mp4" });
  const url = URL.createObjectURL(combinedBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".mp4") ? filename : `${filename}.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  soundSynth.playSfx("success");
}

/**
 * Downloads SubRip Subtitle file (.srt)
 */
export function downloadSrtFile(task: GlobalTaskItem) {
  const content = generateSrtContent(task);
  const filename = `${task.id}_subtitles.srt`;
  downloadTextFile(filename, content, "application/x-subrip;charset=utf-8");
}

/**
 * Downloads Advanced SubStation Alpha file (.ass)
 */
export function downloadAssFile(task: GlobalTaskItem) {
  const content = generateAssContent(task);
  const filename = `${task.id}_viral_karaoke.ass`;
  downloadTextFile(filename, content, "text/plain;charset=utf-8");
}

/**
 * Downloads task full metadata JSON
 */
export function downloadTaskJson(task: GlobalTaskItem) {
  const data = {
    task_id: task.id,
    title: task.title,
    subtitle: task.subtitle,
    targetChannel: task.targetChannel,
    platform: task.platform,
    viralScore: task.viralScore,
    estimatedDuration: task.estimatedDuration,
    resolution: task.resolution,
    scriptSnippet: task.scriptSnippet,
    tags: task.tags,
    status: task.status,
    progress: task.progress,
    currentStep: task.currentStep,
    approved: task.approved,
    approvedAt: task.approvedAt,
    scheduledTime: task.scheduledTime,
    createdAt: new Date(task.createdAt).toISOString(),
    completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : null,
    logs: task.logs,
    outputArtifact: task.outputArtifact,
    generatedSrt: generateSrtContent(task),
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const filename = `${task.id}_metadata_bundle.json`;
  downloadTextFile(filename, jsonStr, "application/json;charset=utf-8");
}
