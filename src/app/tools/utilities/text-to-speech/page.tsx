"use client";

import { useState, useEffect } from "react";
import {
  Volume2,
  Play,
  Pause,
  Square,
  Shield,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function TextToSpeechPage() {
  const [text, setText] = useState(
    "Welcome to ToolKit. This utility converts your text into spoken audio using your browser's native speech synthesis engine."
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const volume = 1;
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      if (available.length > 0) {
        // default to first english voice or index 0
        const engIdx = available.findIndex((v) => v.lang.startsWith("en"));
        setSelectedVoiceIndex(engIdx !== -1 ? engIdx : 0);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if (!("speechSynthesis" in window) || !text.trim()) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (voices[selectedVoiceIndex]) {
      utterance.voice = voices[selectedVoiceIndex];
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Everyday Utilities", href: "/tools/utilities" },
            { label: "Text to Speech" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Volume2 size={16} />
            <span>Everyday Utilities</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            In-Browser Text to Speech
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Convert any text into natural voice audio using your device built-in speech synthesis engine.
            Zero cloud API limits and 100% private.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="flex items-center justify-between">
                <label className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Enter Text to Speak
                </label>
                <span className="font-body text-xs" style={{ color: "var(--text-muted)" }}>
                  {text.length} characters
                </span>
              </div>

              <textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste text to read aloud..."
                className="w-full rounded-lg border p-3 font-body text-sm leading-relaxed"
                style={{
                  backgroundColor: "var(--surface-tinted)",
                  borderColor: "var(--border-warm)",
                  color: "var(--text-primary)",
                }}
              />

              {/* Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4" style={{ borderColor: "var(--border-warm)" }}>
                <div>
                  <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Voice ({voices.length} detected)
                  </label>
                  <select
                    value={selectedVoiceIndex}
                    onChange={(e) => setSelectedVoiceIndex(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border px-3 py-2 font-body text-xs"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {voices.map((v, i) => (
                      <option key={i} value={i}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    <span>Speed / Rate</span>
                    <span className="font-mono">{rate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    <span>Pitch</span>
                    <span className="font-mono">{pitch}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSpeak}
                  disabled={!text.trim()}
                  className="px-6 py-2.5 rounded-lg font-body text-sm font-semibold flex items-center gap-2 text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  <Play size={16} />
                  <span>{isPaused ? "Resume Audio" : isPlaying ? "Restart" : "Speak Text"}</span>
                </button>

                {isPlaying && (
                  <button
                    type="button"
                    onClick={handlePause}
                    className="px-4 py-2.5 rounded-lg border font-body text-sm font-medium flex items-center gap-1.5 transition-all"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <Pause size={16} />
                    <span>Pause</span>
                  </button>
                )}

                {(isPlaying || isPaused) && (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="px-4 py-2.5 rounded-lg border font-body text-sm font-medium flex items-center gap-1.5 transition-all hover:bg-red-500/10 text-red-500"
                  >
                    <Square size={16} />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--amber-tint)",
                borderColor: "rgba(200, 123, 58, 0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-2 font-headline font-semibold text-sm" style={{ color: "var(--amber-primary)" }}>
                <Shield size={16} />
                <h4>Native Speech Engine</h4>
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Speech is synthesized natively by your browser and operating system (Apple Voice, Windows SAPI, or Android TTS). No audio files or text snippets are uploaded to third-party APIs.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
