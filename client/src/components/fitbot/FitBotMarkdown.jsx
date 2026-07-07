/**
 * Lightweight markdown renderer for FitBot replies.
 * Supports: headers, bold, italic, lists, inline/code blocks, line breaks.
 */
export default function FitBotMarkdown({ content }) {
  if (!content) return null;

  const blocks = parseBlocks(String(content));

  return (
    <div className="fitbot-markdown">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

function parseBlocks(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: "code", lang, content: codeLines.join("\n") });
      i += 1;
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      blocks.push({ type: "heading", level, content: line.replace(/^#+\s*/, "") });
      i += 1;
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s*/, ""));
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s*/, ""));
        i += 1;
      }
      blocks.push({ type: "olist", items });
      continue;
    }

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^#{1,3}\s/.test(lines[i]) && !/^[-*]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) && !lines[i].startsWith("```")) {
      paraLines.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: "p", content: paraLines.join("\n") });
  }

  return blocks;
}

function renderInline(text) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      parts.push(<code key={match.index} className="fitbot-inline-code">{token.slice(1, -1)}</code>);
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

function renderBlock(block, key) {
  switch (block.type) {
    case "heading":
      if (block.level === 1) return <h3 key={key} className="fitbot-md-h1">{renderInline(block.content)}</h3>;
      if (block.level === 2) return <h4 key={key} className="fitbot-md-h2">{renderInline(block.content)}</h4>;
      return <h5 key={key} className="fitbot-md-h3">{renderInline(block.content)}</h5>;
    case "list":
      return (
        <ul key={key} className="fitbot-md-list">
          {block.items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case "olist":
      return (
        <ol key={key} className="fitbot-md-list fitbot-md-olist">
          {block.items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    case "code":
      return (
        <pre key={key} className="fitbot-md-pre">
          <code>{block.content}</code>
        </pre>
      );
    default:
      return (
        <p key={key} className="fitbot-md-p">
          {block.content.split("\n").map((line, j, arr) => (
            <span key={j}>
              {renderInline(line)}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      );
  }
}
