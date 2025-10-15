import type { ReactNode } from "react";
import { memo, useState } from "react";

const MAX_VISIBLE = 5;

function faviconUrlFromHref(href: string): string {
  const host = new URL(href).hostname;
  return `https://icons.duckduckgo.com/ip3/${host}.ico`;
}

function renderItem(row: DuckDuckGoOutput.Row): ReactNode {
  const href = row.href;
  const title = row.title || href;
  const icon = faviconUrlFromHref(href);

  return (
    <li key={row.title}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={href}
        className="underline inline-flex items-center gap-2"
      >
        <img
          src={icon}
          width={16}
          height={16}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        {title}
      </a>
    </li>
  );
}

export function DuckDuckGoOutput(props: DuckDuckGoOutput.Props): ReactNode {
  const { part } = props;
  const output = part?.data?.output;

  // Makes sure there are no rows with empty strings for href
  const rows: DuckDuckGoOutput.Row[] = output
    .filter((row: DuckDuckGoOutput.Row) => row.href !== "")

  // Variables for hiding the link overflow
  const hasOverflow = rows.length > MAX_VISIBLE;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, MAX_VISIBLE);

  return (
    <div>
      <ul className="space-y-1 text-sm">{visible.map(renderItem)}</ul>

      {hasOverflow && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs underline"
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export const DuckDuckGoOutputMemo = memo(DuckDuckGoOutput);

export namespace DuckDuckGoOutput {
  export
  type Props = {
    part: any;
  };

  export
  type Row = {
    href: string;
    title: string;
  };
}
