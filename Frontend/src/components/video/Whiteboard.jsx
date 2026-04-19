import React, { useRef, useState, useEffect, useCallback } from "react";
import { Trash2, X, Minus, Plus } from "lucide-react";

const COLORS = [
  "#ffffff",
  "#ff4444",
  "#44ff44",
  "#4488ff",
  "#ffff44",
  "#ff44ff",
  "#44ffff",
];

/**
 * Whiteboard — collaborative canvas with drawing tools.
 * Sends stroke data via onDraw callback; receives remote strokes via remoteStroke prop.
 */
const Whiteboard = ({ onDraw, onClear, remoteStroke, onClose }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState("pen"); // pen | eraser
  const lastPoint = useRef(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    // Fill with dark background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Save current content
      const imageData = ctxRef.current.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctxRef.current.putImageData(imageData, 0, 0);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Draw remote strokes
  useEffect(() => {
    if (!remoteStroke || !ctxRef.current || !canvasRef.current) return;

    // Handle clear command
    if (remoteStroke.clear) {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const { from, to, color: strokeColor, width, toolType } = remoteStroke;

    if (!from || !to) return;

    // Convert normalized (0-1) coords back to canvas pixels
    const fromX = from.x * canvas.width;
    const fromY = from.y * canvas.height;
    const toX = to.x * canvas.width;
    const toY = to.y * canvas.height;

    ctx.beginPath();
    ctx.strokeStyle = toolType === "eraser" ? "#1e293b" : strokeColor;
    ctx.lineWidth = toolType === "eraser" ? width * 3 : width;
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
  }, [remoteStroke]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    // Return normalized coordinates (0-1) for cross-device compatibility
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPoint.current = getPos(e);
  };

  const draw = useCallback(
    (e) => {
      e.preventDefault();
      if (!isDrawing || !ctxRef.current || !canvasRef.current) return;

      const currentPoint = getPos(e);
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;

      // Convert normalized coords to local canvas pixels for drawing
      const fromX = lastPoint.current.x * canvas.width;
      const fromY = lastPoint.current.y * canvas.height;
      const toX = currentPoint.x * canvas.width;
      const toY = currentPoint.y * canvas.height;

      ctx.beginPath();
      ctx.strokeStyle = tool === "eraser" ? "#1e293b" : color;
      ctx.lineWidth = tool === "eraser" ? lineWidth * 3 : lineWidth;
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      // Send normalized stroke data to peer
      if (onDraw) {
        onDraw({
          from: lastPoint.current,
          to: currentPoint,
          color,
          width: lineWidth,
          toolType: tool,
        });
      }

      lastPoint.current = currentPoint;
    },
    [isDrawing, color, lineWidth, tool, onDraw]
  );

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (onClear) onClear();
  };

  return (
    <div className="flex flex-col h-full bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold text-sm">Whiteboard</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-red-400 transition-colors p-1"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-700/50">
        {/* Tool selector */}
        <div className="flex items-center gap-1 bg-gray-700/50 rounded-lg p-1">
          <button
            onClick={() => setTool("pen")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              tool === "pen"
                ? "bg-cyan-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Pen
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              tool === "eraser"
                ? "bg-cyan-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Eraser
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setTool("pen");
              }}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                color === c && tool === "pen"
                  ? "border-cyan-400 scale-110"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Line width */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setLineWidth(Math.max(1, lineWidth - 1))}
            className="text-gray-400 hover:text-white"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs text-gray-400 w-4 text-center">
            {lineWidth}
          </span>
          <button
            onClick={() => setLineWidth(Math.min(20, lineWidth + 1))}
            className="text-gray-400 hover:text-white"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-2">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
