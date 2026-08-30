import React from 'react';

interface AiMessageRendererProps {
  content: string;
}

export const AiMessageRenderer: React.FC<AiMessageRendererProps> = ({ content }) => {
  // Split lines into structured logical blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: { type: 'bullet' | 'number'; items: string[] } | null = null;
  let tableBuffer: string[] = [];

  const flushList = () => {
    if (!listBuffer) return;
    if (listBuffer.type === 'bullet') {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {listBuffer.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0 mt-1.5" />
              <span className="flex-1">{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`list-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {listBuffer.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              <span className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="flex-1">{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    listBuffer = null;
  };

  const flushTable = () => {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer
      .map(row => row.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1))
      .filter(row => row.length > 0);

    if (rows.length > 0) {
      const isHeaderDivider = (r: string[]) => r.every(cell => /^:?-+:?$/.test(cell));
      const filteredRows = rows.filter(r => !isHeaderDivider(r));
      const headerRow = filteredRows[0];
      const bodyRows = filteredRows.slice(1);

      elements.push(
        <div key={`table-${elements.length}`} className="my-2.5 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-[11px] text-left">
            {headerRow && (
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-2 py-1.5">
                      {renderInlineFormatting(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-2 py-1.5 text-slate-700 dark:text-slate-300">
                      {renderInlineFormatting(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Table line
    if (line.startsWith('|') && line.endsWith('|')) {
      if (listBuffer) flushList();
      tableBuffer.push(line);
      continue;
    } else if (tableBuffer.length > 0) {
      flushTable();
    }

    // Empty line
    if (!line) {
      if (listBuffer) flushList();
      continue;
    }

    // Heading level 3 or 4
    if (line.startsWith('### ') || line.startsWith('#### ')) {
      if (listBuffer) flushList();
      const headingText = line.replace(/^#{3,4}\s+/, '');
      const isSub = line.startsWith('#### ');
      elements.push(
        <h4
          key={`h-${elements.length}`}
          className={`font-bold tracking-tight text-slate-900 dark:text-white ${
            isSub ? 'text-xs mt-2.5 mb-1 text-indigo-700 dark:text-indigo-300' : 'text-[13px] pb-1 mb-1.5 border-b border-slate-200 dark:border-slate-700'
          }`}
        >
          {renderInlineFormatting(headingText)}
        </h4>
      );
      continue;
    }

    // Bullet point
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const itemText = line.replace(/^[-*]\s+/, '');
      if (!listBuffer || listBuffer.type !== 'bullet') {
        flushList();
        listBuffer = { type: 'bullet', items: [itemText] };
      } else {
        listBuffer.items.push(itemText);
      }
      continue;
    }

    // Numbered list (e.g. "1. ", "2. ")
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const itemText = numMatch[2];
      if (!listBuffer || listBuffer.type !== 'number') {
        flushList();
        listBuffer = { type: 'number', items: [itemText] };
      } else {
        listBuffer.items.push(itemText);
      }
      continue;
    }

    // Regular paragraph
    if (listBuffer) flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-1">
        {renderInlineFormatting(line)}
      </p>
    );
  }

  if (listBuffer) flushList();
  if (tableBuffer.length > 0) flushTable();

  return <div className="space-y-1.5">{elements}</div>;
};

/**
 * Format bold (**text**), italics (*text*), code (`text`), and risk/money badges
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  // Regex to split on bold, italics, code
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
          {inner}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      const inner = token.slice(1, -1);
      return (
        <em key={idx} className="italic text-slate-600 dark:text-slate-400">
          {inner}
        </em>
      );
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      const inner = token.slice(1, -1);
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 font-mono text-[10px] text-indigo-600 dark:text-indigo-300 font-medium"
        >
          {inner}
        </code>
      );
    }
    return token;
  });
}
