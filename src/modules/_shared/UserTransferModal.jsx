import { useEffect, useMemo, useState } from "react";
import { getAreaText } from "./userDirectory";
import "./SelectionWidgets.css";

function includesKeyword(text, keyword) {
  return text.toLowerCase().includes(keyword.trim().toLowerCase());
}

export default function UserTransferModal({
  title,
  description,
  items,
  value,
  summary = [],
  leftTitle = "待选用户",
  rightTitle = "已选用户",
  leftEmptyText = "当前没有可选用户",
  rightEmptyText = "当前还没有选中用户",
  searchPlaceholder = "搜索姓名、角色、区域",
  allowSelectAll = false,
  onClose,
  onConfirm,
}) {
  const [draftValue, setDraftValue] = useState(value);
  const [leftChecked, setLeftChecked] = useState([]);
  const [rightChecked, setRightChecked] = useState([]);
  const [leftKeyword, setLeftKeyword] = useState("");
  const [rightKeyword, setRightKeyword] = useState("");

  useEffect(() => {
    const validIds = new Set(items.map((item) => item.id));
    const nextValue = value.filter((id) => validIds.has(id));
    setDraftValue(nextValue);
    setLeftChecked((current) => current.filter((id) => validIds.has(id) && !nextValue.includes(id)));
    setRightChecked((current) => current.filter((id) => validIds.has(id) && nextValue.includes(id)));
  }, [items, value]);

  const selectedIdSet = useMemo(() => new Set(draftValue), [draftValue]);

  const leftItems = useMemo(
    () =>
      items.filter((item) => {
        if (selectedIdSet.has(item.id)) return false;
        return includesKeyword(
          [item.nickname, item.role, item.title, item.city, item.county, item.organization].join(" "),
          leftKeyword,
        );
      }),
    [items, leftKeyword, selectedIdSet],
  );

  const rightItems = useMemo(
    () =>
      items.filter((item) => {
        if (!selectedIdSet.has(item.id)) return false;
        return includesKeyword(
          [item.nickname, item.role, item.title, item.city, item.county, item.organization].join(" "),
          rightKeyword,
        );
      }),
    [items, rightKeyword, selectedIdSet],
  );

  const addSelected = () => {
    if (!leftChecked.length) return;
    const nextSet = new Set([...draftValue, ...leftChecked]);
    setDraftValue(items.filter((item) => nextSet.has(item.id)).map((item) => item.id));
    setLeftChecked([]);
  };

  const removeSelected = () => {
    if (!rightChecked.length) return;
    const removeSet = new Set(rightChecked);
    setDraftValue((current) => current.filter((id) => !removeSet.has(id)));
    setRightChecked([]);
  };

  const renderItem = (item, checked, onToggle) => (
    <label key={item.id} className={`transfer-item ${checked ? "active" : ""}`}>
      <input type="checkbox" checked={checked} onChange={() => onToggle(item.id)} />
      <div className="transfer-item-main">
        <strong>{item.nickname}</strong>
        <span>{getAreaText(item)}</span>
        <em>{item.role} · {item.title}</em>
      </div>
    </label>
  );

  return (
    <div className="role-modal-backdrop" role="dialog" aria-modal="true">
      <div className="role-modal role-modal--wide transfer-modal-shell">
        <div className="role-modal-head">
          <div>
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="role-modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="role-modal-body transfer-modal-body">
          {summary.length ? (
            <div className="transfer-modal-summary">
              {summary.map((item) => (
                <span key={item} className="transfer-summary-pill">{item}</span>
              ))}
            </div>
          ) : null}

          <div className="transfer-layout">
            <section className="transfer-panel">
              <div className="transfer-panel-head">
                <strong>{leftTitle}</strong>
                <div className="transfer-panel-tools">
                  {allowSelectAll && leftItems.length ? (
                    <button
                      type="button"
                      className="transfer-head-button"
                      onClick={() => setLeftChecked(leftItems.map((item) => item.id))}
                    >
                      全选
                    </button>
                  ) : null}
                  <span>{leftItems.length} 人</span>
                </div>
              </div>
              <div className="transfer-search">
                <input
                  className="input"
                  value={leftKeyword}
                  placeholder={searchPlaceholder}
                  onChange={(event) => setLeftKeyword(event.target.value)}
                />
              </div>
              <div className="transfer-list">
                {leftItems.length ? (
                  leftItems.map((item) =>
                    renderItem(item, leftChecked.includes(item.id), (userId) =>
                      setLeftChecked((current) =>
                        current.includes(userId)
                          ? current.filter((id) => id !== userId)
                          : [...current, userId],
                      ),
                    ),
                  )
                ) : (
                  <div className="transfer-empty">{leftEmptyText}</div>
                )}
              </div>
            </section>

            <div className="transfer-actions">
              <button
                type="button"
                className="transfer-action-button"
                onClick={addSelected}
                disabled={!leftChecked.length}
              >
                添加 →
              </button>
              <button
                type="button"
                className="transfer-action-button"
                onClick={removeSelected}
                disabled={!rightChecked.length}
              >
                ← 移除
              </button>
            </div>

            <section className="transfer-panel">
              <div className="transfer-panel-head">
                <strong>{rightTitle}</strong>
                <span>{rightItems.length} 人</span>
              </div>
              <div className="transfer-search">
                <input
                  className="input"
                  value={rightKeyword}
                  placeholder={searchPlaceholder}
                  onChange={(event) => setRightKeyword(event.target.value)}
                />
              </div>
              <div className="transfer-list">
                {rightItems.length ? (
                  rightItems.map((item) =>
                    renderItem(item, rightChecked.includes(item.id), (userId) =>
                      setRightChecked((current) =>
                        current.includes(userId)
                          ? current.filter((id) => id !== userId)
                          : [...current, userId],
                      ),
                    ),
                  )
                ) : (
                  <div className="transfer-empty">{rightEmptyText}</div>
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="role-modal-actions">
          <button type="button" className="ghost-button slim-button" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="primary-button slim-button"
            onClick={() => onConfirm(draftValue)}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
}
