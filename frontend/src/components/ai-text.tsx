import { Fragment } from "react";

/**
 * Renderer ringan untuk teks jawaban AI. Model sering mengembalikan subset
 * markdown (bold, italic, list bernomor/bullet, pemisah ***). Komponen ini
 * mengubahnya menjadi elemen React tanpa dependency parser dan tanpa HTML
 * mentah, sehingga aman dari injeksi.
 */

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  /* Tangkap ***bold-italic***, lalu **bold**, *italic*, dan `kode` */
  const pattern =
    /\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|`([^`]+)`/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold text-ink">
          {match[1]}
        </strong>,
      );
    } else if (match[2] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold text-ink">
          {match[2]}
        </strong>,
      );
    } else if (match[3] !== undefined) {
      nodes.push(<em key={key++}>{match[3]}</em>);
    } else {
      nodes.push(
        <code key={key++} className="font-mono text-[0.9em]">
          {match[4]}
        </code>,
      );
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

type Block =
  | { type: "paragraph"; lines: string[] }
  | { type: "heading"; text: string }
  | { type: "ordered"; items: string[] }
  | { type: "bullet"; items: string[] }
  | { type: "table"; rows: string[][] }
  | { type: "divider" };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    const last = blocks[blocks.length - 1];

    if (!line) continue;

    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line)) {
      blocks.push({ type: "divider" });
      continue;
    }

    /* Heading markdown: ### Judul -> blok heading tanpa tanda # */
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      blocks.push({ type: "heading", text: heading[1] });
      continue;
    }

    /* Baris tabel markdown: | a | b | -> kumpulkan sel; baris pemisah |---| dibuang */
    if (/^\|.*\|$/.test(line)) {
      if (/^\|[\s:|-]+\|$/.test(line)) continue;
      const cells = line
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      if (last?.type === "table") last.rows.push(cells);
      else blocks.push({ type: "table", rows: [cells] });
      continue;
    }

    const ordered = line.match(/^\d+[.)]\s+(.*)$/);
    if (ordered) {
      if (last?.type === "ordered") last.items.push(ordered[1]);
      else blocks.push({ type: "ordered", items: [ordered[1]] });
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      if (last?.type === "bullet") last.items.push(bullet[1]);
      else blocks.push({ type: "bullet", items: [bullet[1]] });
      continue;
    }

    blocks.push({ type: "paragraph", lines: [line] });
  }

  return blocks;
}

export function AiText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseBlocks(text);

  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, i) => {
        if (block.type === "divider") {
          return <hr key={i} className="border-lavender" />;
        }
        if (block.type === "heading") {
          return (
            <p key={i} className="font-semibold text-ink">
              {renderInline(block.text)}
            </p>
          );
        }
        if (block.type === "table") {
          const [head, ...body] = block.rows;
          return (
            <div key={i} className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr>
                    {head.map((cell, j) => (
                      <th
                        key={j}
                        className="border-b border-lavender py-1.5 pr-3 font-semibold text-ink"
                      >
                        {renderInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, j) => (
                    <tr key={j}>
                      {row.map((cell, k) => (
                        <td
                          key={k}
                          className="border-b border-lavender/60 py-1.5 pr-3 align-top"
                        >
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === "ordered") {
          return (
            <ol key={i} className="list-decimal space-y-1.5 pl-5">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === "bullet") {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>{renderInline(line)}</Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
