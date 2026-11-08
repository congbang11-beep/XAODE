import React from 'react';

interface Props {
  content: string;
  className?: string;
}

export const FormulaRenderer: React.FC<Props> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split content by newlines to preserve paragraphs
  const lines = content.split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed text-slate-800 ${className}`}>
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-2" />;

        return (
          <p key={idx} className="break-words">
            {renderStyledText(line)}
          </p>
        );
      })}
    </div>
  );
};

function renderStyledText(text: string) {
  // Replace standard math symbols and sub/superscripts visually
  // If text contains $...$, render math styled span
  const parts = text.split(/(\$[^$]+\$)/g);

  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1);
      return (
        <span
          key={i}
          className="inline-block px-1 font-mono text-[0.95em] font-medium text-indigo-900 bg-indigo-50/70 rounded border border-indigo-100"
        >
          {formatMathCharacters(math)}
        </span>
      );
    }
    return <React.Fragment key={i}>{formatMathCharacters(part)}</React.Fragment>;
  });
}

function formatMathCharacters(str: string): string {
  return str
    .replace(/\\int/g, '∫')
    .replace(/\\infty/g, '∞')
    .replace(/\\sqrt/g, '√')
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\subset/g, '⊂')
    .replace(/\\cup/g, '∪')
    .replace(/\\cap/g, '∩')
    .replace(/\\le|\\leq/g, '≤')
    .replace(/\\ge|\\geq/g, '≥')
    .replace(/\\ne|\\neq/g, '≠')
    .replace(/\\times/g, '×')
    .replace(/\\pm/g, '±')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\pi/g, 'π')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ');
}
