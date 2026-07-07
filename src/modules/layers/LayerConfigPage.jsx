import { useState, useRef, useCallback, useEffect } from "react";
import { showToast } from "../../components/utils";
import "./layers.css";

const STORAGE_KEY = "tdt-layer-config-v1";

const BUILTIN_ICONS = [
  { id: "mountain", name: "山脉", svg: '<path d="M4 16l4-8 4 4 4-8 4 12" />' },
  { id: "forest", name: "森林", svg: '<path d="M6 16l4-12 4 12M10 4v12M4 16h12" />' },
  { id: "water", name: "水域", svg: '<path d="M2 12c2-2 4-2 6 0s4 2 6 0M2 16c2-2 4-2 6 0s4 2 6 0" />' },
  { id: "building", name: "建筑", svg: '<path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4" />' },
  { id: "leaf", name: "生态", svg: '<path d="M12 2C7 2 3 7 3 12s4 9 9 9c-2-4-2-9 0-13 2 4 2 9 0 13 5 0 9-5 9-9 0-5-4-10-9-10z" />' },
  { id: "land", name: "土地", svg: '<rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" />' },
];

const DEFAULT_LAYERS = [
  { id: "wetland_park", name: "湿地公园", category: "美丽自然" },
  { id: "nature_reserve", name: "自然保护区", category: "美丽自然" },
  { id: "urban_greenway", name: "城市绿道", category: "美丽自然" },
  { id: "forest_park", name: "森林公园", category: "美丽自然" },
  { id: "world_heritage", name: "世界遗产", category: "美丽自然" },
  { id: "archaeological_park", name: "考古遗址公园", category: "美好生活" },
  { id: "scenic_area", name: "风景名胜区", category: "美好生活" },
  { id: "geopark", name: "地质公园", category: "美好生活" },
  { id: "permanent_farmland", name: "永久基本农田", category: "自然资源" },
  { id: "development_boundary", name: "城镇开发边界", category: "自然资源" },
  { id: "eco_redline", name: "生态保护红线", category: "自然资源" },
  { id: "resource_protected", name: "自然资源保护地", category: "自然资源" },
  { id: "wetland_protected", name: "湿地保护区", category: "自然资源" },
  { id: "mountain_peak", name: "山峰", category: "自然资源" },
  { id: "reservoir", name: "水库", category: "自然资源" },
  { id: "lake", name: "湖泊", category: "自然资源" },
  { id: "investment_land", name: "招商土地", category: "自然资源" },
  { id: "ancient_tree", name: "名木古树（部分）", category: "自然资源" },
];

const DEFAULT_CATEGORIES = [
  { id: "cat_1", name: "美丽自然", icon: "leaf", order: 1 },
  { id: "cat_2", name: "美好生活", icon: "building", order: 2 },
  { id: "cat_3", name: "自然资源", icon: "mountain", order: 3 },
];

function getDefaultConfig() {
  const layerAssignments = DEFAULT_LAYERS.map((layer, index) => {
    const category = DEFAULT_CATEGORIES.find((cat) => cat.name === layer.category);
    return {
      layerId: layer.id,
      categoryId: category?.id || null,
      displayName: layer.name,
      order: index + 1,
    };
  });

  return {
    categories: [...DEFAULT_CATEGORIES],
    layerAssignments,
  };
}

function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.error("Failed to load layer config:", error);
  }
  return getDefaultConfig();
}

function LayerIcon({ icon, className = "" }) {
  if (!icon) return null;
  if (icon.startsWith("data:") || icon.startsWith("http")) {
    return <img className={className} src={icon} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 4 }} />;
  }
  const found = BUILTIN_ICONS.find((item) => item.id === icon) || BUILTIN_ICONS[0];
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: found.svg }}
    />
  );
}

/* ── LayerConfigPage ── */
function LayerConfigPage() {
  const [config, setConfig] = useState(() => loadConfig());
  const [originalConfig, setOriginalConfig] = useState(() => loadConfig());
  const [editingCategory, setEditingCategory] = useState(null);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("mountain");
  const [newCategoryIconDataUrl, setNewCategoryIconDataUrl] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState(null);
  const [deleteLayerTargets, setDeleteLayerTargets] = useState({}); // { layerId: categoryId }
  const [migratedLayerIds, setMigratedLayerIds] = useState([]);
  const migratedLayerTimeoutRef = useRef(null);

  /* drag state */
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [categoryDropIndicator, setCategoryDropIndicator] = useState(null); // { categoryId, index }
  const [draggedLayer, setDraggedLayer] = useState(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null); // { categoryId, index }

  const fileInputRef = useRef(null);
  const layerListRefs = useRef({});
  const draggedLayerRef = useRef(null);
  const draggedCategoryRef = useRef(null);

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);
  const categories = [...config.categories].sort((a, b) => a.order - b.order);

  /* ── Expose handlers to App.jsx topbar ── */
  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setOriginalConfig(JSON.parse(JSON.stringify(config)));
      showToast("配置已保存", "success");
    } catch {
      showToast("保存失败", "error");
    }
  }, [config]);

  const handleReset = useCallback(() => {
    setConfig(JSON.parse(JSON.stringify(originalConfig)));
    showToast("已重置到上次保存的状态");
  }, [originalConfig]);

  const handleRestoreDefault = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  useEffect(() => {
    window.__layerConfigPage = { handleSave, handleReset, handleRestoreDefault, hasChanges };
    return () => { delete window.__layerConfigPage; };
  }, [handleSave, handleReset, handleRestoreDefault, hasChanges]);

  useEffect(() => {
    return () => {
      if (migratedLayerTimeoutRef.current) {
        clearTimeout(migratedLayerTimeoutRef.current);
      }
    };
  }, []);

  /* ── Category CRUD ── */
  function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      showToast("请输入分类名称", "error");
      return;
    }
    const newId = `cat_${Date.now()}`;
    const maxOrder = Math.max(...config.categories.map((c) => c.order), 0);
    setConfig({
      ...config,
      categories: [...config.categories, { id: newId, name: newCategoryName.trim(), icon: newCategoryIconDataUrl || newCategoryIcon, order: maxOrder + 1 }],
    });
    setNewCategoryName("");
    setNewCategoryIcon("mountain");
    setNewCategoryIconDataUrl(null);
    setShowNewCategoryDialog(false);
    showToast("分类已创建", "success");
  }

  function handleDeleteCategory(categoryId) {
    const affected = config.layerAssignments.filter((la) => la.categoryId === categoryId);
    const remaining = config.categories.filter((c) => c.id !== categoryId).sort((a, b) => a.order - b.order);
    const firstRemainingId = remaining[0]?.id ?? null;
    if (affected.length > 0) {
      const targets = {};
      affected.forEach((la) => { targets[la.layerId] = firstRemainingId; });
      setPendingDeleteCategory({ categoryId, layerCount: affected.length, layers: affected.map((la) => la.layerId) });
      setDeleteLayerTargets(targets);
      setShowConfirmDialog(true);
      return;
    }
    performDeleteCategory(categoryId, firstRemainingId);
  }

  function performDeleteCategory(categoryId) {
    const remaining = config.categories.filter((c) => c.id !== categoryId).sort((a, b) => a.order - b.order);
    if (remaining.length === 0) {
      showToast("无法删除唯一分类，请先创建一个新分类", "error");
      setShowConfirmDialog(false);
      setPendingDeleteCategory(null);
      return;
    }

    const movedLayerIds = config.layerAssignments
      .filter((la) => la.categoryId === categoryId)
      .sort((a, b) => a.order - b.order)
      .map((la) => la.layerId);

    const existingMaxOrder = remaining.reduce((acc, category) => {
      const maxOrder = Math.max(
        0,
        ...config.layerAssignments
          .filter((la) => la.categoryId === category.id)
          .map((la) => la.order)
      );
      acc[category.id] = maxOrder;
      return acc;
    }, {});

    const movedAssignments = config.layerAssignments
      .filter((la) => la.categoryId === categoryId)
      .sort((a, b) => a.order - b.order)
      .map((la) => {
        const destId = deleteLayerTargets[la.layerId] || remaining[0].id;
        const nextOrder = (existingMaxOrder[destId] = existingMaxOrder[destId] + 1);
        return { ...la, categoryId: destId, order: nextOrder };
      });

    setConfig({
      ...config,
      categories: remaining,
      layerAssignments: [
        ...config.layerAssignments.filter((la) => la.categoryId !== categoryId),
        ...movedAssignments,
      ],
    });

    if (migratedLayerTimeoutRef.current) {
      clearTimeout(migratedLayerTimeoutRef.current);
    }
    setMigratedLayerIds(movedLayerIds);
    migratedLayerTimeoutRef.current = setTimeout(() => setMigratedLayerIds([]), 2200);

    setShowConfirmDialog(false);
    setPendingDeleteCategory(null);
    setDeleteLayerTargets({});
    showToast("分类已删除，图层已迁移", "success");
  }

  function handleUpdateCategory(categoryId, updates) {
    if (typeof updates.name === "string") {
      const nextName = updates.name.trim();
      if (!nextName) {
        showToast("分类名称不能为空", "error");
        setEditingCategory(null);
        return;
      }
      updates.name = nextName;
    }
    setConfig({
      ...config,
      categories: config.categories.map((c) => c.id === categoryId ? { ...c, ...updates } : c),
    });
    setEditingCategory(null);
  }

  /* ── Icon upload ── */
  function handleIconFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      showToast("图片大小不能超过 200KB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewCategoryIconDataUrl(reader.result);
      setNewCategoryIcon("custom");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  /* ── Category drag-and-drop ── */
  function handleCategoryDragStart(e, categoryId) {
    draggedCategoryRef.current = categoryId;
    setDraggedCategory(categoryId);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.closest(".category-item")?.classList.add("dragging");
  }

  function handleCategoryDragEnd(e) {
    draggedCategoryRef.current = null;
    setDraggedCategory(null);
    setDragOverCategoryId(null);
    e.currentTarget.closest(".category-item")?.classList.remove("dragging");
  }

  function getCategoryDropIndex(e, categoryId) {
    const cats = [...config.categories].sort((a, b) => a.order - b.order);
    const targetIdx = cats.findIndex((c) => c.id === categoryId);
    if (targetIdx === -1) return null;
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientY < rect.top + rect.height / 2 ? targetIdx : targetIdx + 1;
  }

  function handleCategoryDragOver(e, categoryId) {
    e.preventDefault();
    const src = draggedCategoryRef.current;
    if (!src || src === categoryId) return;
    e.dataTransfer.dropEffect = "move";
    const index = getCategoryDropIndex(e, categoryId);
    if (index === null) return;
    setCategoryDropIndicator({ categoryId, index });
  }

  function handleCategoryDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setCategoryDropIndicator(null);
    }
  }

  function handleCategoryDrop(e, targetCategoryId) {
    e.preventDefault();
    const srcId = draggedCategoryRef.current;
    const indicator = categoryDropIndicator;
    setCategoryDropIndicator(null);
    if (!srcId || srcId === targetCategoryId || !indicator) return;
    const cats = [...config.categories].sort((a, b) => a.order - b.order);
    const fromIdx = cats.findIndex((c) => c.id === srcId);
    if (fromIdx === -1) return;
    const [moved] = cats.splice(fromIdx, 1);
    let toIdx = indicator.index;
    if (fromIdx < indicator.index) toIdx -= 1;
    cats.splice(toIdx, 0, moved);
    cats.forEach((c, i) => (c.order = i + 1));
    setConfig({ ...config, categories: cats });
  }

  /* ── Layer drag-and-drop with drop indicator ── */
  function handleLayerDragStart(e, layerId, categoryId) {
    const data = { layerId, categoryId };
    draggedLayerRef.current = data;
    setDraggedLayer(data);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.closest(".layer-item")?.classList.add("dragging");
  }

  function handleLayerDragEnd(e) {
    draggedLayerRef.current = null;
    setDraggedLayer(null);
    setDropIndicator(null);
    e.currentTarget.closest(".layer-item")?.classList.remove("dragging");
  }

  function getLayerDropIndex(e, categoryId) {
    const listEl = layerListRefs.current[categoryId];
    if (!listEl) return null;
    const items = [...listEl.querySelectorAll(".layer-item")];
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) return i;
    }
    return items.length;
  }

  function handleLayerDragOver(e, categoryId) {
    e.preventDefault();
    if (!draggedLayerRef.current) return;
    e.dataTransfer.dropEffect = "move";
    const idx = getLayerDropIndex(e, categoryId);
    if (idx !== null) {
      setDropIndicator({ categoryId, index: idx });
    }
  }

  function handleLayerDragLeave(e, categoryId) {
    const listEl = layerListRefs.current[categoryId];
    if (listEl && !listEl.contains(e.relatedTarget)) {
      setDropIndicator(null);
    }
  }

  function handleLayerListDrop(e, targetCategoryId) {
    e.preventDefault();
    const indicator = dropIndicator;
    const src = draggedLayerRef.current;
    setDropIndicator(null);
    setDragOverCategoryId(null);
    if (!src) return;

    const { layerId: srcId, categoryId: srcCatId } = src;
    const insertIndex = indicator?.index ?? null;

    if (srcCatId === targetCategoryId) {
      /* Same category – reorder */
      const sameCat = config.layerAssignments
        .filter((la) => la.categoryId === targetCategoryId)
        .sort((a, b) => a.order - b.order);
      const fromIdx = sameCat.findIndex((la) => la.layerId === srcId);
      if (fromIdx === -1) return;
      const [moved] = sameCat.splice(fromIdx, 1);
      const toIdx = insertIndex !== null ? Math.min(insertIndex, sameCat.length) : sameCat.length;
      sameCat.splice(toIdx, 0, moved);
      sameCat.forEach((la, i) => (la.order = i + 1));

      const ids = new Set(sameCat.map((la) => la.layerId));
      const rest = config.layerAssignments.filter(
        (la) => !ids.has(la.layerId) || la.categoryId !== targetCategoryId
      );
      setConfig({ ...config, layerAssignments: [...rest, ...sameCat] });
    } else {
      /* Cross-category – move layer */
      const srcCat = config.layerAssignments
        .filter((la) => la.categoryId === srcCatId)
        .sort((a, b) => a.order - b.order);
      const tgtCat = config.layerAssignments
        .filter((la) => la.categoryId === targetCategoryId)
        .sort((a, b) => a.order - b.order);

      const srcIdx = srcCat.findIndex((la) => la.layerId === srcId);
      if (srcIdx === -1) return;
      const [moved] = srcCat.splice(srcIdx, 1);
      moved.categoryId = targetCategoryId;
      const toIdx = insertIndex !== null ? Math.min(insertIndex, tgtCat.length) : tgtCat.length;
      tgtCat.splice(toIdx, 0, moved);

      srcCat.forEach((la, i) => (la.order = i + 1));
      tgtCat.forEach((la, i) => (la.order = i + 1));

      const movedIds = new Set([...srcCat, ...tgtCat].map((la) => la.layerId));
      const rest = config.layerAssignments.filter(
        (la) => !movedIds.has(la.layerId) || (la.categoryId !== srcCatId && la.categoryId !== targetCategoryId)
      );
      setConfig({ ...config, layerAssignments: [...rest, ...srcCat, ...tgtCat] });
    }
  }

  function handleSectionDragOver(e, categoryId) {
    const src = draggedLayerRef.current;
    if (src && src.categoryId !== categoryId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverCategoryId(categoryId);
      const categoryLayers = getCategoryLayers(categoryId);
      setDropIndicator({ categoryId, index: categoryLayers.length });
    }
  }

  function handleSectionDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCategoryId(null);
      setDropIndicator(null);
    }
  }

  function getCategoryLayers(categoryId) {
    return config.layerAssignments
      .filter((la) => la.categoryId === categoryId)
      .sort((a, b) => a.order - b.order)
      .map((la) => ({
        ...la,
        ...DEFAULT_LAYERS.find((l) => l.id === la.layerId),
      }));
  }

  return (
    <div className="layer-config-page">
      <div className="layer-config-content">
        <section className="config-section category-manager">
          <div className="section-header">
            <h2>图层分类</h2>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowNewCategoryDialog(true)}>
              + 新建分类
            </button>
          </div>

          <div className="category-list">
            {categoryDropIndicator?.index === categories.length && (
              <div className="drop-line-indicator bottom" />
            )}
            {categories.map((category, idx) => (
              <div
                key={category.id}
                className={`category-item${categoryDropIndicator?.index === idx ? " drop-before" : ""}`}
                draggable
                onDragStart={(e) => handleCategoryDragStart(e, category.id)}
                onDragEnd={handleCategoryDragEnd}
                onDragOver={(e) => handleCategoryDragOver(e, category.id)}
                onDragLeave={handleCategoryDragLeave}
                onDrop={(e) => handleCategoryDrop(e, category.id)}
              >
                <div className="category-info">
                  <span className="drag-handle" title="拖拽排序">⠿</span>
                  <span className="category-icon">
                    <LayerIcon icon={category.icon} />
                  </span>
                  <div className="category-copy">
                    {editingCategory?.id === category.id ? (
                      <input
                        type="text"
                        className="input-inline"
                        defaultValue={category.name}
                        autoFocus
                        onBlur={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateCategory(category.id, { name: e.target.value });
                          else if (e.key === "Escape") setEditingCategory(null);
                        }}
                      />
                    ) : (
                      <span className="category-name">{category.name}</span>
                    )}
                    <small>{getCategoryLayers(category.id).length} 个图层</small>
                  </div>
                </div>
                <div className="category-actions">
                  <button type="button" className="btn-icon" onClick={() => setEditingCategory({ id: category.id })} title="编辑名称">✎</button>
                  <button type="button" className="btn-icon btn-icon-danger" onClick={() => handleDeleteCategory(category.id)} title="删除分类">×</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="layer-groups">
          {categories.map((category) => {
            const categoryLayers = getCategoryLayers(category.id);
            const isDropTarget = draggedLayer && draggedLayer.categoryId !== category.id && dropIndicator?.categoryId === category.id;

            return (
              <section
                key={category.id}
                className={`config-section layer-group-section${dragOverCategoryId === category.id ? " drag-over" : ""}`}
                onDragOver={(e) => handleSectionDragOver(e, category.id)}
                onDragLeave={handleSectionDragLeave}
                onDrop={(e) => handleLayerListDrop(e, category.id)}
              >
                <div className="section-header">
                  <div className="section-title-with-icon">
                    <span className="section-icon"><LayerIcon icon={category.icon} /></span>
                    <h2>{category.name}</h2>
                  </div>
                  <span className="layer-count">{categoryLayers.length} 个图层</span>
                </div>

                {categoryLayers.length > 0 ? (
                  <div
                    className="layer-list"
                    ref={(el) => { layerListRefs.current[category.id] = el; }}
                    onDragOver={(e) => handleLayerDragOver(e, category.id)}
                    onDragLeave={(e) => handleLayerDragLeave(e, category.id)}
                    onDrop={(e) => handleLayerListDrop(e, category.id)}
                  >
                    {categoryLayers.map((layer, idx) => (
                      <div
                        key={layer.id}
                        className={`layer-item${draggedLayer?.layerId === layer.id ? " dragging" : ""}${dropIndicator?.categoryId === category.id && dropIndicator.index === idx ? " drop-before" : ""}${migratedLayerIds.includes(layer.id) ? " migrated" : ""}`}
                        draggable
                        onDragStart={(e) => handleLayerDragStart(e, layer.id, category.id)}
                        onDragEnd={handleLayerDragEnd}
                      >
                        <div className="layer-item-left">
                          <span className="drag-handle" title="拖拽排序">⠿</span>
                          <span className="layer-name">{layer.displayName}</span>
                        </div>
                      </div>
                    ))}
                    {isDropTarget && dropIndicator?.index === categoryLayers.length && (
                      <div className="drop-line-indicator" />
                    )}
                  </div>
                ) : (
                  <div
                    className={`layer-empty-state${dragOverCategoryId === category.id && draggedLayer ? " drag-over" : ""}`}
                    onDragOver={(e) => {
                      if (draggedLayerRef.current) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDragOverCategoryId(category.id);
                        setDropIndicator({ categoryId: category.id, index: 0 });
                      }
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setDragOverCategoryId(null);
                        setDropIndicator(null);
                      }
                    }}
                    onDrop={(e) => handleLayerListDrop(e, category.id)}
                  >
                    {dropIndicator?.categoryId === category.id && dropIndicator.index === 0 && (
                      <div className="drop-line-indicator" />
                    )}
                    暂无图层，拖拽图层到此处
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* ── Create category dialog ── */}
      {showNewCategoryDialog && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建分类</h3>
              <button type="button" className="btn-icon" onClick={() => { setShowNewCategoryDialog(false); setNewCategoryIconDataUrl(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>分类名称</label>
                <input type="text" className="input" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="请输入分类名称" autoFocus />
              </div>
              <div className="form-group">
                <label>分类图标</label>
                <div className="icon-picker-row">
                  {BUILTIN_ICONS.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      className={`icon-option${newCategoryIcon === icon.id && !newCategoryIconDataUrl ? " selected" : ""}`}
                      onClick={() => { setNewCategoryIcon(icon.id); setNewCategoryIconDataUrl(null); }}
                      title={icon.name}
                    >
                      <LayerIcon icon={icon.id} />
                    </button>
                  ))}
                </div>
                <button type="button" className="btn btn-sm btn-outline icon-upload-btn" onClick={() => fileInputRef.current?.click()}>
                  上传图标
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="icon-upload-input" onChange={handleIconFileChange} />
              </div>
              {newCategoryIconDataUrl && (
                <div className="icon-preview">
                  <img src={newCategoryIconDataUrl} alt="预览" />
                  <button type="button" className="btn-icon btn-icon-danger" onClick={() => { setNewCategoryIconDataUrl(null); setNewCategoryIcon("mountain"); }} title="移除">×</button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowNewCategoryDialog(false); setNewCategoryIconDataUrl(null); }}>取消</button>
              <button type="button" className="btn btn-primary" onClick={handleCreateCategory}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm dialog ── */}
      {showConfirmDialog && (
        <div className="modal-overlay" onClick={() => setShowConfirmDialog(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认操作</h3>
              <button type="button" className="btn-icon" onClick={() => setShowConfirmDialog(false)}>×</button>
            </div>
            <div className="modal-body">
              {pendingDeleteCategory ? (
                <div>
                  <p>该分类含有 {pendingDeleteCategory.layerCount} 个图层。删除分类前，请先为这些图层选择新的目标分类。</p>
                  <div className="delete-layer-list">
                    {pendingDeleteCategory.layers.map((layerId) => {
                      const la = config.layerAssignments.find((l) => l.layerId === layerId);
                      const otherCategories = config.categories
                        .filter((c) => c.id !== pendingDeleteCategory.categoryId)
                        .sort((a, b) => a.order - b.order);
                      return (
                        <div key={layerId} className="delete-layer-row">
                          <span className="delete-layer-name">{la?.displayName || layerId}</span>
                          <select
                            className="delete-layer-select"
                            value={deleteLayerTargets[layerId] || otherCategories[0]?.id || ""}
                            onChange={(e) => setDeleteLayerTargets((prev) => ({ ...prev, [layerId]: e.target.value }))}
                          >
                            {otherCategories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p>将恢复到系统默认配置，当前自定义配置将丢失，是否继续？</p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowConfirmDialog(false); setPendingDeleteCategory(null); setDeleteLayerTargets({}); }}>取消</button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => pendingDeleteCategory ? performDeleteCategory(pendingDeleteCategory.categoryId) : (setConfig(getDefaultConfig()), setOriginalConfig(JSON.parse(JSON.stringify(getDefaultConfig()))), localStorage.removeItem(STORAGE_KEY), setShowConfirmDialog(false), showToast("已恢复默认配置", "success"))}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LayerConfigPage;
