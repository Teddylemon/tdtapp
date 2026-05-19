import { useEffect, useState } from "react";

export default function FilterSelect({ placeholder, options, defaultAll = false, onChange, optionCounts = {} }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(defaultAll ? [...options] : []);

  useEffect(() => {
    if (!open) return undefined;

    const close = (event) => {
      if (!event.target.closest(".filter-select-shell")) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const allSelected = selected.length === options.length && options.length > 0;
  const hasSelected = selected.length > 0;

  useEffect(() => {
    onChange?.(selected, allSelected);
  }, [allSelected, onChange, selected]);

  const toggleOption = (value) => {
    if (value === "__ALL__") {
      setSelected(allSelected ? [] : [...options]);
      return;
    }

    setSelected((current) => {
      const exists = current.includes(value);
      if (exists) return current.filter((item) => item !== value);
      return [...current, value];
    });
  };

  const clear = () => setSelected([]);
  const getCount = (option) => optionCounts?.[option];

  return (
    <div
      className={[
        "filter-select-shell",
        open ? "open" : "",
        hasSelected ? "has-selected" : "",
        allSelected ? "all-selected" : "",
        selected.length > 1 && !allSelected ? "multi-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className={`filter-select-trigger ${hasSelected ? "selected" : ""} ${open ? "open" : ""}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="filter-trigger-label">
          {!hasSelected && <span className="filter-placeholder">{placeholder}</span>}
          {allSelected && <span className="filter-token filter-token-all">全部</span>}
          {!allSelected && selected.length === 1 && <span className="filter-token">{selected[0]}</span>}
          {!allSelected && selected.length > 1 && (
            <span className="filter-token-group">
              {selected.map((item) => (
                <span key={item} className="filter-token">
                  {item}
                </span>
              ))}
            </span>
          )}
        </span>
        {hasSelected ? (
          <i
            className="filter-clear"
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              clear();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                clear();
              }
            }}
          >
            ×
          </i>
        ) : (
          <b className="filter-caret" aria-hidden="true">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 4.5 3 3 3-3" />
            </svg>
          </b>
        )}
      </button>

      {open && (
        <div className="filter-select-menu">
          <button
            type="button"
            className={`filter-select-option ${allSelected ? "active" : ""}`}
            onClick={() => toggleOption("__ALL__")}
          >
            <span className={`checkmark ${allSelected ? "checked" : ""}`} />
            <span>全部</span>
          </button>
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                className={`filter-select-option ${active ? "active" : ""}`}
                onClick={() => toggleOption(option)}
              >
                <span className={`checkmark ${active ? "checked" : ""}`} />
                <span className="filter-option-label">
                  <span>{option}</span>
                  {getCount(option) !== undefined ? <em>{getCount(option)}</em> : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
