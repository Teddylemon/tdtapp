import { useEffect, useRef, useState } from "react";

export default function FeedbackSingleSelect({ value, options, onChange, placeholder = "请选择", compact = false, searchable = false, searchPlaceholder = "请输入关键词" }) {
  const shellRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((item) => item.value === value) ?? null;

  useEffect(() => {
    if (!open) return undefined;

    const close = (event) => {
      if (!shellRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = searchable
    ? options.filter((item) =>
        [item.label, item.searchText, item.meta, item.idText]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(normalizedQuery)),
      )
    : options;

  return (
    <div ref={shellRef} className={`feedback-picker ${compact ? "compact" : ""} ${open ? "open" : ""}`}>
      <button
        type="button"
        className="feedback-picker-trigger"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`feedback-picker-trigger-text ${selected ? "" : "placeholder"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="feedback-picker-caret" aria-hidden="true">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 4.5 3 3 3-3" />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="feedback-picker-menu">
          {searchable ? (
            <div className="feedback-picker-search-shell">
              <input
                className="input feedback-picker-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
          ) : null}

          <div className="feedback-picker-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`feedback-picker-option ${active ? "active" : ""}`}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span className="feedback-picker-option-main">
                      <strong>{option.label}</strong>
                      {option.meta ? <em>{option.meta}</em> : null}
                    </span>
                    {option.idText ? <span className="feedback-picker-option-id">{option.idText}</span> : null}
                  </button>
                );
              })
            ) : (
              <div className="feedback-picker-empty">没有匹配的主反馈</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
