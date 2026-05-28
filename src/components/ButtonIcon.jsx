export default function ButtonIcon({ type }) {
  return (
    <span className={`button-icon button-icon-${type}`} aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {type === "view" && (
          <>
            <path d="M1.5 8s2.3-4 6.5-4 6.5 4 6.5 4-2.3 4-6.5 4-6.5-4-6.5-4Z" />
            <circle cx="8" cy="8" r="1.8" />
          </>
        )}
        {type === "up" && (
          <>
            <path d="M8 12V4" />
            <path d="m4.8 7.2 3.2-3.2 3.2 3.2" />
          </>
        )}
        {type === "down" && (
          <>
            <path d="M8 4v8" />
            <path d="m4.8 8.8 3.2 3.2 3.2-3.2" />
          </>
        )}
        {type === "approve" && (
          <>
            <path d="m3.8 8.3 2.4 2.4 6-6" />
          </>
        )}
        {type === "reject" && (
          <>
            <path d="m5 5 6 6" />
            <path d="m11 5-6 6" />
          </>
        )}
        {type === "sync" && (
          <>
            <path d="M13 8a5 5 0 0 1-8.5 3.5" />
            <path d="m2.8 9.8 1.7 1.8 2.1-1.5" />
            <path d="M3 8a5 5 0 0 1 8.5-3.5" />
            <path d="m13.2 6.2-1.7-1.8-2.1 1.5" />
          </>
        )}
        {type === "marker" && (
          <>
            <path d="M8 13s3.2-3.3 3.2-5.7A3.2 3.2 0 0 0 8 4.1a3.2 3.2 0 0 0-3.2 3.2C4.8 9.7 8 13 8 13Z" />
            <circle cx="8" cy="7.3" r="1.1" />
          </>
        )}
        {type === "back" && (
          <>
            <path d="M13 8H3" />
            <path d="m6.8 4.4-3.6 3.6 3.6 3.6" />
          </>
        )}
        {type === "export" && (
          <>
            <path d="M8 2v8" />
            <path d="m4.8 6.8 3.2 3.2 3.2-3.2" />
            <path d="M2 11v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" />
          </>
        )}
      </svg>
    </span>
  );
}
