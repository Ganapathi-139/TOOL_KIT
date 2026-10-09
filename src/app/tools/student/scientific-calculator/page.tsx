"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Calculator,
  Shield,
  Delete,
  History,
  Check,
  ChevronRight,
  GraduationCap,
  Percent,
  Sigma,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

// Safe Mathematical Parser & Evaluator
function evaluateExpression(expr: string, isRad: boolean): { result: string; error?: string } {
  const cleanExpr = expr.trim();
  if (!cleanExpr) return { result: "0" };

  // Token types
  type TokenType = "NUMBER" | "OP" | "FN" | "LPAREN" | "RPAREN" | "CONST";
  interface Token {
    type: TokenType;
    value: string;
  }

  const tokens: Token[] = [];
  let i = 0;

  // 1. Tokenize
  while (i < cleanExpr.length) {
    const ch = cleanExpr[i];

    // Whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Numbers (including decimal point)
    if (/[0-9]/.test(ch) || (ch === "." && i + 1 < cleanExpr.length && /[0-9]/.test(cleanExpr[i + 1]))) {
      let numStr = "";
      while (i < cleanExpr.length && (/[0-9]/.test(cleanExpr[i]) || cleanExpr[i] === ".")) {
        numStr += cleanExpr[i];
        i++;
      }
      tokens.push({ type: "NUMBER", value: numStr });
      continue;
    }

    // Constants
    if (ch === "π" || cleanExpr.slice(i, i + 2).toLowerCase() === "pi") {
      tokens.push({ type: "CONST", value: "π" });
      i += ch === "π" ? 1 : 2;
      continue;
    }
    if (ch === "e" && (i + 1 === cleanExpr.length || /[^a-z]/i.test(cleanExpr[i + 1]))) {
      tokens.push({ type: "CONST", value: "e" });
      i++;
      continue;
    }

    // Functions
    const remaining = cleanExpr.slice(i).toLowerCase();
    const fnMatch = remaining.match(/^(sin|cos|tan|sqrt|log|ln|abs)/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      tokens.push({ type: "FN", value: fnName });
      i += fnName.length;
      continue;
    }

    // Parentheses
    if (ch === "(") {
      tokens.push({ type: "LPAREN", value: "(" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "RPAREN", value: ")" });
      i++;
      continue;
    }

    // Operators
    if (["+", "-", "*", "/", "×", "÷", "^", "%"].includes(ch)) {
      const normalizedOp = ch === "×" ? "*" : ch === "÷" ? "/" : ch;
      tokens.push({ type: "OP", value: normalizedOp });
      i++;
      continue;
    }

    // Unknown character
    return { result: "Error", error: `Unrecognized character: '${ch}'` };
  }

  // 2. Insert implicit multiplication (e.g. 2π -> 2*π, 2(3) -> 2*(3), (2)(3) -> (2)*(3), 2sqrt(4) -> 2*sqrt(4))
  const expandedTokens: Token[] = [];
  for (let k = 0; k < tokens.length; k++) {
    const curr = tokens[k];
    const prev = k > 0 ? tokens[k - 1] : null;

    if (
      prev &&
      (prev.type === "NUMBER" || prev.type === "CONST" || prev.type === "RPAREN") &&
      (curr.type === "FN" || curr.type === "CONST" || curr.type === "LPAREN")
    ) {
      expandedTokens.push({ type: "OP", value: "*" });
    }
    expandedTokens.push(curr);
  }

  // 3. Recursive Descent Parser
  let pos = 0;

  function peek(): Token | null {
    return pos < expandedTokens.length ? expandedTokens[pos] : null;
  }

  function consume(expectedValue?: string): Token {
    const token = peek();
    if (!token) throw new Error("Unexpected end of expression");
    if (expectedValue && token.value !== expectedValue) {
      throw new Error(`Expected '${expectedValue}', found '${token.value}'`);
    }
    pos++;
    return token;
  }

  function parseExpression(): number {
    return parseAddition();
  }

  // Addition & Subtraction
  function parseAddition(): number {
    let left = parseMultiplication();
    while (true) {
      const next = peek();
      if (next && next.type === "OP" && (next.value === "+" || next.value === "-")) {
        consume();
        const right = parseMultiplication();
        left = next.value === "+" ? left + right : left - right;
      } else {
        break;
      }
    }
    return left;
  }

  // Multiplication & Division & Percentage
  function parseMultiplication(): number {
    let left = parseExponentiation();
    while (true) {
      const next = peek();
      if (next && next.type === "OP" && (next.value === "*" || next.value === "/" || next.value === "%")) {
        consume();
        if (next.value === "%") {
          left = left / 100;
        } else {
          const right = parseExponentiation();
          if (next.value === "*") {
            left = left * right;
          } else {
            if (right === 0) throw new Error("Division by 0");
            left = left / right;
          }
        }
      } else {
        break;
      }
    }
    return left;
  }

  // Exponentiation (right-associative: 2^3^2 = 2^(3^2))
  function parseExponentiation(): number {
    let left = parseUnary();
    const next = peek();
    if (next && next.type === "OP" && next.value === "^") {
      consume();
      const right = parseExponentiation();
      left = Math.pow(left, right);
    }
    return left;
  }

  // Unary (+, -)
  function parseUnary(): number {
    const next = peek();
    if (next && next.type === "OP" && (next.value === "+" || next.value === "-")) {
      consume();
      const factor = parseUnary();
      return next.value === "-" ? -factor : factor;
    }
    return parsePrimary();
  }

  // Primary: Number, Constant, Parentheses, Functions
  function parsePrimary(): number {
    const token = peek();
    if (!token) throw new Error("Unexpected end of expression");

    if (token.type === "NUMBER") {
      consume();
      const val = parseFloat(token.value);
      if (isNaN(val)) throw new Error("Invalid number format");
      return val;
    }

    if (token.type === "CONST") {
      consume();
      return token.value === "π" ? Math.PI : Math.E;
    }

    if (token.type === "LPAREN") {
      consume("(");
      const exprVal = parseExpression();
      if (peek() && peek()?.value === ")") {
        consume(")");
      }
      return exprVal;
    }

    if (token.type === "FN") {
      consume();
      const fnName = token.value;
      if (peek() && peek()?.value === "(") {
        consume("(");
      }
      const arg = parseExpression();
      if (peek() && peek()?.value === ")") {
        consume(")");
      }

      switch (fnName) {
        case "sin": {
          const rad = isRad ? arg : (arg * Math.PI) / 180;
          const val = Math.sin(rad);
          // Clean precision for exact angles (e.g. sin(30) -> 0.5, sin(180) -> 0)
          return Math.abs(val) < 1e-12 ? 0 : Math.abs(val - 0.5) < 1e-12 ? 0.5 : Math.abs(val + 0.5) < 1e-12 ? -0.5 : val;
        }
        case "cos": {
          const rad = isRad ? arg : (arg * Math.PI) / 180;
          const val = Math.cos(rad);
          // Clean precision for exact angles (e.g. cos(90) -> 0, cos(60) -> 0.5)
          return Math.abs(val) < 1e-12 ? 0 : Math.abs(val - 0.5) < 1e-12 ? 0.5 : Math.abs(val + 0.5) < 1e-12 ? -0.5 : val;
        }
        case "tan": {
          if (!isRad) {
            const normalizedDeg = Math.abs(arg) % 180;
            if (Math.abs(normalizedDeg - 90) < 1e-7) {
              throw new Error("Undefined (tan 90°)");
            }
          }
          const rad = isRad ? arg : (arg * Math.PI) / 180;
          const val = Math.tan(rad);
          return Math.abs(val) < 1e-12 ? 0 : val;
        }
        case "sqrt": {
          if (arg < 0) throw new Error("Domain Error: sqrt of negative");
          return Math.sqrt(arg);
        }
        case "log": {
          if (arg <= 0) throw new Error("Domain Error: log of non-positive");
          return Math.log10(arg);
        }
        case "ln": {
          if (arg <= 0) throw new Error("Domain Error: ln of non-positive");
          return Math.log(arg);
        }
        case "abs":
          return Math.abs(arg);
        default:
          throw new Error(`Unknown function: ${fnName}`);
      }
    }

    throw new Error(`Unexpected token '${token.value}'`);
  }

  try {
    const finalVal = parseExpression();
    if (pos < expandedTokens.length) {
      throw new Error(`Unexpected extra characters after expression`);
    }

    if (!isFinite(finalVal) || isNaN(finalVal)) {
      return { result: "Error", error: "Calculation resulted in an invalid number" };
    }

    // Format output cleanly: eliminate floating precision noise (e.g. 0.1 + 0.2 = 0.3)
    let formatted: string;
    if (Math.abs(finalVal) < 1e-12 && finalVal !== 0) {
      formatted = "0";
    } else {
      const rounded = parseFloat(finalVal.toPrecision(12));
      formatted = rounded.toString();
    }

    return { result: formatted };
  } catch (err: unknown) {
    return {
      result: "Error",
      error: err instanceof Error ? err.message : "Syntax Error",
    };
  }
}

export default function ScientificCalculatorPage() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRad, setIsRad] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  const append = useCallback((val: string) => {
    setStatusMessage(null);
    setExpression((prev) => prev + val);
  }, []);

  const clearAll = useCallback(() => {
    setExpression("");
    setResult("0");
    setStatusMessage(null);
  }, []);

  const backspace = useCallback(() => {
    setStatusMessage(null);
    setExpression((prev) => {
      // If deleting a multi-char function name like "sin(", "cos(", "sqrt(", delete the whole token
      const fnMatches = ["sin(", "cos(", "tan(", "sqrt(", "log(", "ln(", "abs("];
      for (const fn of fnMatches) {
        if (prev.endsWith(fn)) {
          return prev.slice(0, -fn.length);
        }
      }
      return prev.slice(0, -1);
    });
  }, []);

  const evaluateMath = useCallback(() => {
    if (!expression.trim()) return;

    const evalResult = evaluateExpression(expression, isRad);
    if (evalResult.error) {
      setResult("Error");
      setStatusMessage(evalResult.error);
    } else {
      setResult(evalResult.result);
      setStatusMessage(null);
      setHistory((prev) => [`${expression} = ${evalResult.result}`, ...prev.slice(0, 9)]);
    }
  }, [expression, isRad]);

  // Handle Physical Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture if user is typing in an active text input or textarea elsewhere
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      const key = e.key;

      if (key >= "0" && key <= "9") {
        e.preventDefault();
        append(key);
      } else if (key === ".") {
        e.preventDefault();
        append(".");
      } else if (key === "+") {
        e.preventDefault();
        append("+");
      } else if (key === "-") {
        e.preventDefault();
        append("-");
      } else if (key === "*") {
        e.preventDefault();
        append("×");
      } else if (key === "/") {
        e.preventDefault();
        append("÷");
      } else if (key === "%") {
        e.preventDefault();
        append("%");
      } else if (key === "^") {
        e.preventDefault();
        append("^");
      } else if (key === "(" || key === ")") {
        e.preventDefault();
        append(key);
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        evaluateMath();
      } else if (key === "Backspace") {
        e.preventDefault();
        backspace();
      } else if (key === "Escape") {
        e.preventDefault();
        clearAll();
      } else if (key.toLowerCase() === "s") {
        e.preventDefault();
        append("sin(");
      } else if (key.toLowerCase() === "c") {
        e.preventDefault();
        append("cos(");
      } else if (key.toLowerCase() === "t") {
        e.preventDefault();
        append("tan(");
      } else if (key.toLowerCase() === "r") {
        e.preventDefault();
        append("sqrt(");
      } else if (key.toLowerCase() === "l") {
        e.preventDefault();
        append("log(");
      } else if (key.toLowerCase() === "p") {
        e.preventDefault();
        append("π");
      } else if (key.toLowerCase() === "e") {
        e.preventDefault();
        append("e");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [append, backspace, clearAll, evaluateMath]);

  const copyResult = () => {
    if (!result || result === "0" || result === "Error") return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Student Tools", href: "/tools/student" },
            { label: "Scientific Calculator" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Calculator size={16} />
            <span>Student Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Scientific Calculator
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Perform algebraic, trigonometric, logarithmic, and power calculations with real-time physical keyboard support and precision error handling.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Calculator Body */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div
              className="rounded-2xl border p-6 flex flex-col gap-5 max-w-lg mx-auto w-full shadow-sm"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              {/* Display Box */}
              <div
                ref={displayRef}
                className="p-5 rounded-xl border text-right flex flex-col justify-end min-h-[110px] transition-all relative overflow-hidden"
                style={{
                  backgroundColor: "var(--surface-tinted)",
                  borderColor: "var(--border-warm)",
                }}
              >
                {/* Expression Formula */}
                <div
                  className="font-mono text-sm truncate select-all mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {expression || "0"}
                </div>

                {/* Primary Result */}
                <div
                  className="font-headline font-bold text-3xl sm:text-4xl truncate tracking-tight cursor-pointer"
                  onClick={copyResult}
                  title="Click to copy result"
                  style={{
                    color: statusMessage ? "#ef4444" : "var(--text-primary)",
                  }}
                >
                  {result}
                </div>

                {/* Error Banner if domain or division error */}
                {statusMessage && (
                  <div className="text-xs font-body font-medium text-red-500 mt-1 truncate">
                    {statusMessage}
                  </div>
                )}

                {/* Copy feedback */}
                {copied && (
                  <span className="absolute top-3 left-3 text-xs font-body px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold flex items-center gap-1">
                    <Check size={12} /> Copied
                  </span>
                )}
              </div>

              {/* Mode indicator & Hint bar */}
              <div className="flex items-center justify-between text-xs px-1" style={{ color: "var(--text-muted)" }}>
                <span className="font-mono font-medium">Mode: <strong className={isRad ? "text-amber-500" : "text-emerald-500"}>{isRad ? "RAD (Radians)" : "DEG (Degrees)"}</strong></span>
                <span className="font-body hidden sm:inline">Supports physical keyboard (0-9, +-*/, Enter, Esc, Backspace)</span>
              </div>

              {/* ── Real Physical Calculator Keypad Matrix (5 Columns) ── */}
              <div
                className="font-mono text-sm select-none"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: "0.5rem",
                  width: "100%",
                }}
              >
                {/* ── Row 1: Mode Toggle & Primary Trig & AC ── */}
                <button
                  type="button"
                  onClick={() => setIsRad(!isRad)}
                  className="h-11 sm:h-12 rounded-xl font-bold border transition-all active:scale-95 flex items-center justify-center text-xs"
                  style={{
                    backgroundColor: isRad ? "var(--amber-tint)" : "var(--surface-tinted)",
                    borderColor: isRad ? "var(--amber-primary)" : "var(--border-warm)",
                    color: isRad ? "var(--amber-primary)" : "var(--text-secondary)",
                  }}
                  title="Toggle Degrees / Radians"
                >
                  {isRad ? "RAD" : "DEG"}
                </button>
                <button
                  type="button"
                  onClick={() => append("sin(")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-sm"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  sin
                </button>
                <button
                  type="button"
                  onClick={() => append("cos(")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-sm"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  cos
                </button>
                <button
                  type="button"
                  onClick={() => append("tan(")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-sm"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  tan
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="h-11 sm:h-12 rounded-xl font-bold border border-red-500/30 text-red-500 hover:bg-red-500/10 active:scale-95 flex items-center justify-center text-sm"
                  style={{ backgroundColor: "transparent" }}
                  title="All Clear"
                >
                  AC
                </button>

                {/* ── Row 2: Logs, Powers, Roots & Backspace ── */}
                <button
                  type="button"
                  onClick={() => append("ln(")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-sm"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  ln
                </button>
                <button
                  type="button"
                  onClick={() => append("log(")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-sm"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  log
                </button>
                <button
                  type="button"
                  onClick={() => append("sqrt(")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-sm"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  √
                </button>
                <button
                  type="button"
                  onClick={() => append("^")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-sm"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                  title="Power (xʸ)"
                >
                  xʸ
                </button>
                <button
                  type="button"
                  onClick={backspace}
                  className="h-11 sm:h-12 rounded-xl font-bold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-sm"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                  title="Backspace / Delete"
                >
                  ⌫
                </button>

                {/* ── Row 3: Parentheses, Constants & Division ── */}
                <button
                  type="button"
                  onClick={() => append("(")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-base"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  (
                </button>
                <button
                  type="button"
                  onClick={() => append(")")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-base"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  )
                </button>
                <button
                  type="button"
                  onClick={() => append("π")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-base"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  π
                </button>
                <button
                  type="button"
                  onClick={() => append("e")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-base"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  e
                </button>
                <button
                  type="button"
                  onClick={() => append("÷")}
                  className="h-11 sm:h-12 rounded-xl font-bold border transition-all hover:brightness-105 active:scale-95 flex items-center justify-center text-lg"
                  style={{ backgroundColor: "var(--amber-tint)", borderColor: "var(--border-warm)", color: "var(--amber-primary)" }}
                >
                  ÷
                </button>

                {/* ── Row 4: 7, 8, 9, % & Multiplication ── */}
                {["7", "8", "9"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => append(d)}
                    className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-base"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => append("%")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-sm"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => append("×")}
                  className="h-11 sm:h-12 rounded-xl font-bold border transition-all hover:brightness-105 active:scale-95 flex items-center justify-center text-lg"
                  style={{ backgroundColor: "var(--amber-tint)", borderColor: "var(--border-warm)", color: "var(--amber-primary)" }}
                >
                  ×
                </button>

                {/* ── Row 5: 4, 5, 6, |x| & Subtraction ── */}
                {["4", "5", "6"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => append(d)}
                    className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-base"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => append("abs(")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-xs sm:text-sm"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                  title="Absolute Value |x|"
                >
                  |x|
                </button>
                <button
                  type="button"
                  onClick={() => append("-")}
                  className="h-11 sm:h-12 rounded-xl font-bold border transition-all hover:brightness-105 active:scale-95 flex items-center justify-center text-xl"
                  style={{ backgroundColor: "var(--amber-tint)", borderColor: "var(--border-warm)", color: "var(--amber-primary)" }}
                >
                  −
                </button>

                {/* ── Row 6: 1, 2, 3, 00 & Addition ── */}
                {["1", "2", "3"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => append(d)}
                    className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-base"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => append("00")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-sm"
                  style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  00
                </button>
                <button
                  type="button"
                  onClick={() => append("+")}
                  className="h-11 sm:h-12 rounded-xl font-bold border transition-all hover:brightness-105 active:scale-95 flex items-center justify-center text-xl"
                  style={{ backgroundColor: "var(--amber-tint)", borderColor: "var(--border-warm)", color: "var(--amber-primary)" }}
                >
                  +
                </button>

                {/* ── Row 7: 0 (span 2), ., Equals (span 2) ── */}
                <button
                  type="button"
                  onClick={() => append("0")}
                  className="h-11 sm:h-12 rounded-xl font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-base"
                  style={{
                    gridColumn: "span 2 / span 2",
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => append(".")}
                  className="h-11 sm:h-12 rounded-xl font-bold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center justify-center text-base"
                  style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  .
                </button>
                <button
                  type="button"
                  onClick={evaluateMath}
                  className="h-11 sm:h-12 rounded-xl font-bold text-white shadow transition-all hover:brightness-105 active:scale-95 flex items-center justify-center text-xl tracking-wider"
                  style={{
                    gridColumn: "span 2 / span 2",
                    backgroundColor: "var(--amber-primary)",
                  }}
                  title="Calculate Result (=)"
                >
                  =
                </button>
              </div>
            </div>

            {/* Privacy Card */}
            <div
              className="rounded-xl border p-4 flex items-center gap-3"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
              >
                <Shield size={16} />
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <strong className="font-semibold text-primary">Sandboxed Math Engine:</strong> Mathematical expressions are evaluated via a safe AST tokenizer. No arbitrary code execution or network transmission occurs.
              </p>
            </div>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History size={16} style={{ color: "var(--amber-primary)" }} />
                  <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                    Calculation History
                  </h3>
                </div>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="text-xs font-body hover:underline"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-xs font-body text-center py-6" style={{ color: "var(--text-muted)" }}>
                  No calculations yet. Enter an expression to see recent history.
                </p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const parts = item.split(" = ");
                        if (parts[1]) setResult(parts[1]);
                        if (parts[0]) setExpression(parts[0]);
                      }}
                      className="p-2.5 rounded-lg border font-mono text-xs cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Keyboard Reference */}
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>
                Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                <div><kbd className="px-1.5 py-0.5 rounded border bg-black/5 dark:bg-white/5 font-mono text-[10px]">0-9</kbd> Digits</div>
                <div><kbd className="px-1.5 py-0.5 rounded border bg-black/5 dark:bg-white/5 font-mono text-[10px]">+ - * /</kbd> Ops</div>
                <div><kbd className="px-1.5 py-0.5 rounded border bg-black/5 dark:bg-white/5 font-mono text-[10px]">Enter / =</kbd> Solve</div>
                <div><kbd className="px-1.5 py-0.5 rounded border bg-black/5 dark:bg-white/5 font-mono text-[10px]">Esc</kbd> Clear (AC)</div>
                <div><kbd className="px-1.5 py-0.5 rounded border bg-black/5 dark:bg-white/5 font-mono text-[10px]">Backspace</kbd> Delete</div>
                <div><kbd className="px-1.5 py-0.5 rounded border bg-black/5 dark:bg-white/5 font-mono text-[10px]">s, c, t</kbd> sin, cos, tan</div>
                <div><kbd className="px-1.5 py-0.5 rounded border bg-black/5 dark:bg-white/5 font-mono text-[10px]">r</kbd> sqrt</div>
                <div><kbd className="px-1.5 py-0.5 rounded border bg-black/5 dark:bg-white/5 font-mono text-[10px]">p, e</kbd> π, e</div>
              </div>
            </div>

            {/* Related Tools */}
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                Related Student Tools
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { name: "CGPA & SGPA Calculator", href: "/tools/student/gpa", icon: GraduationCap },
                  { name: "Percentage Calculator", href: "/tools/student/percentage", icon: Percent },
                  { name: "Attendance Calculator", href: "/tools/student/attendance", icon: Sigma },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-body group"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon size={15} style={{ color: "var(--amber-primary)" }} />
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {item.name}
                      </span>
                    </div>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--text-muted)" }} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
