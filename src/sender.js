const INITIAL_SLOTS = 5;
const SLOTS_PER_ROW = 5;
let slots = [];

function createSlot(id) {
  return { id, image: null, markdown: "", caption: "", visible: false };
}

function buildSlotCard(i) {
  const container = document.getElementById("slots-container");
  const card = document.createElement("div");
  card.className = "slot-card";
  card.id = `slot-card-${i}`;
  card.dataset.slot = i;
  card.tabIndex = 0;
  card.innerHTML = `
        <div class="slot-header">
            <span class="drag-handle" draggable="true" title="Drag to reorder">\u2630</span>
            <span class="slot-label">Slot ${i}</span>
            <button class="markdown-edit-btn" id="markdown-edit-${i}" onclick="openMarkdownModal(${i}, event)" title="Edit Markdown Snippet">\u{1F4DD}</button>
        </div>
        <div class="thumb-preview" id="thumb-${i}">No Image Loaded</div>
        <input type="text" class="caption-input" id="caption-${i}" placeholder="Enter caption..." oninput="updateCaption(${i}, this.value)" disabled>
        <div class="slot-controls">
            <button class="slot-btn toggle-btn" id="toggle-${i}" onclick="toggleSlot(${i}, event)" disabled>Show</button>
            <button class="slot-btn exclusive-btn" id="exclusive-${i}" onclick="showExclusive(${i}, event)" disabled>Solo</button>
            <button class="slot-btn remove-btn" id="remove-${i}" onclick="clearSlot(${i}, event)" disabled>Remove</button>
        </div>
    `;
  container.appendChild(card);
  setupBoxListeners(card, i);

  const handle = card.querySelector(".drag-handle");
  handle.addEventListener("dragstart", (e) => handleDragStart(e, i));
  handle.addEventListener("dragend", handleDragEnd);
}

function renderAllSlots() {
  document.getElementById("slots-container").innerHTML = "";
  slots.forEach((slot) => {
    buildSlotCard(slot.id);
    updateSlotUI(slot.id);
  });
}

function addSlots() {
  for (let i = 0; i < SLOTS_PER_ROW; i++) {
    const id = slots.length + 1;
    slots.push(createSlot(id));
    buildSlotCard(id);
    updateSlotUI(id);
  }
  const status = document.getElementById("status");
  status.textContent = `${SLOTS_PER_ROW} slots added (${slots.length} total)`;
  status.style.color = "#2ecc71";
}

function setupDM() {
  slots = Array.from({ length: INITIAL_SLOTS }, (_, i) => createSlot(i + 1));
  renderAllSlots();

  document.addEventListener("paste", (e) => {
    const activeCard = document.activeElement;
    if (activeCard && activeCard.classList.contains("slot-card")) {
      const slotId = parseInt(activeCard.dataset.slot);
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          processImageFile(file, slotId);
          break;
        }
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && markdownModalSlotId !== null) {
      closeMarkdownModal();
    }
  });

  document.getElementById("slot-card-1").focus();
}

function setupBoxListeners(element, slotId) {
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    element.addEventListener(eventName, (e) => e.preventDefault(), false);
  });
  ["dragenter", "dragover"].forEach((eventName) => {
    element.addEventListener(
      eventName,
      () => element.classList.add("drag-over"),
      false,
    );
  });
  ["dragleave", "drop"].forEach((eventName) => {
    element.addEventListener(
      eventName,
      () => element.classList.remove("drag-over"),
      false,
    );
  });
  element.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    const sourceId = e.dataTransfer.getData("text/plain");
    if (files.length > 0) {
      processImageFile(files[0], slotId);
    } else if (sourceId) {
      reorderSlots(parseInt(sourceId, 10), slotId);
    }
  });
  element.addEventListener("click", (e) => {
    if (e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON") {
      element.focus();
    }
  });
}

function processImageFile(file, slotId) {
  if (!file || !file.type.startsWith("image/")) return;
  const status = document.getElementById("status");
  status.textContent = "Processing image...";
  status.style.color = "#e67e22";
  const reader = new FileReader();
  reader.onload = function (event) {
    const base64Image = event.target.result;
    const idx = slotId - 1;
    slots[idx].image = base64Image;
    slots[idx].markdown = "";
    slots[idx].visible = false;
    updateSlotUI(slotId);
    broadcastState();
    status.textContent = `Slot ${slotId} loaded privately!`;
    status.style.color = "#2ecc71";
  };
  reader.readAsDataURL(file);
}

function updateSlotUI(slotId) {
  const idx = slotId - 1;
  const slot = slots[idx];
  const card = document.getElementById(`slot-card-${slotId}`);
  const thumb = document.getElementById(`thumb-${slotId}`);
  const toggleBtn = document.getElementById(`toggle-${slotId}`);
  const exclusiveBtn = document.getElementById(`exclusive-${slotId}`);
  const removeBtn = document.getElementById(`remove-${slotId}`);
  const captionInput = document.getElementById(`caption-${slotId}`);
  if (slot.image || slot.markdown) {
    card.classList.add("has-image");
    thumb.innerHTML = slot.image
      ? `<img src="${slot.image}" alt="Thumbnail">`
      : `<div class="markdown-preview-label">\u{1F4DD} Markdown Snippet</div>`;
    toggleBtn.disabled = false;
    exclusiveBtn.disabled = false;
    removeBtn.disabled = false;
    captionInput.disabled = false;
    captionInput.value = slot.caption || "";
    if (slot.visible) {
      card.classList.add("showing");
      toggleBtn.textContent = "Hide";
      toggleBtn.classList.add("showing");
    } else {
      card.classList.remove("showing");
      toggleBtn.textContent = "Show";
      toggleBtn.classList.remove("showing");
    }
  } else {
    card.className = "slot-card";
    thumb.innerHTML = "No Image Loaded";
    toggleBtn.textContent = "Show";
    toggleBtn.classList.remove("showing");
    toggleBtn.disabled = true;
    exclusiveBtn.disabled = true;
    removeBtn.disabled = true;
    captionInput.value = "";
    captionInput.disabled = true;
  }
}

function updateCaption(slotId, text) {
  const idx = slotId - 1;
  slots[idx].caption = text;
  broadcastState();
}

function updateMarkdown(slotId, text) {
  const idx = slotId - 1;
  slots[idx].markdown = text;
  if (text) slots[idx].image = null;
  updateSlotUI(slotId);
  broadcastState();
}

let markdownModalSlotId = null;

function openMarkdownModal(slotId, event) {
  if (event) event.stopPropagation();
  markdownModalSlotId = slotId;
  document.getElementById("markdown-modal-title").textContent =
    `Edit Markdown Snippet \u2013 Slot ${slotId}`;
  const textarea = document.getElementById("markdown-modal-textarea");
  textarea.value = slots[slotId - 1].markdown || "";
  document.getElementById("markdown-modal").style.display = "flex";
  textarea.focus();
}

function closeMarkdownModal() {
  document.getElementById("markdown-modal").style.display = "none";
  markdownModalSlotId = null;
}

function saveMarkdownModal() {
  if (markdownModalSlotId === null) return;
  const text = document.getElementById("markdown-modal-textarea").value;
  updateMarkdown(markdownModalSlotId, text);
  closeMarkdownModal();
}

function handleMarkdownModalBackdropClick(event) {
  if (event.target.id === "markdown-modal") closeMarkdownModal();
}

function handleDragStart(e, slotId) {
  e.dataTransfer.setData("text/plain", String(slotId));
  e.dataTransfer.effectAllowed = "move";
  e.currentTarget.closest(".slot-card").classList.add("dragging");
}

function handleDragEnd() {
  document
    .querySelectorAll(".slot-card.dragging")
    .forEach((el) => el.classList.remove("dragging"));
}

function reorderSlots(sourceId, targetId) {
  if (sourceId === targetId || isNaN(sourceId)) return;
  const [moved] = slots.splice(sourceId - 1, 1);
  slots.splice(targetId - 1, 0, moved);
  slots.forEach((slot, i) => {
    slot.id = i + 1;
  });
  renderAllSlots();
  broadcastState();
  const status = document.getElementById("status");
  status.textContent = `Slot moved to position ${targetId}`;
  status.style.color = "#3498db";
}

function toggleSlot(slotId, event) {
  if (event) event.stopPropagation();
  const idx = slotId - 1;
  if (!slots[idx].image && !slots[idx].markdown) return;
  slots[idx].visible = !slots[idx].visible;
  updateSlotUI(slotId);
  broadcastState();
}

function showExclusive(slotId, event) {
  if (event) event.stopPropagation();
  const idx = slotId - 1;
  if (!slots[idx].image && !slots[idx].markdown) return;
  slots.forEach((slot, i) => {
    slot.visible = i === idx;
    updateSlotUI(slot.id);
  });
  broadcastState();
  const status = document.getElementById("status");
  status.textContent = `Slot ${slotId} shown exclusively!`;
  status.style.color = "#9b59b6";
}

function clearSlot(slotId, event) {
  if (event) event.stopPropagation();
  const idx = slotId - 1;
  slots[idx].image = null;
  slots[idx].markdown = "";
  slots[idx].visible = false;
  slots[idx].caption = "";
  updateSlotUI(slotId);
  broadcastState();
  const status = document.getElementById("status");
  status.textContent = `Slot ${slotId} removed!`;
  status.style.color = "#e74c3c";
}

function toggleBlackout() {
  isBlackout = !isBlackout;
  const btn = document.getElementById("btn-blackout");
  btn.textContent = isBlackout ? "Show Screen" : "Hide Screen (Blackout)";
  btn.classList.toggle("blackout-active", isBlackout);
  channel.postMessage({ type: "blackout", active: isBlackout });
}

function exportSession() {
  const jsonString = JSON.stringify(slots);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dm_session_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  const status = document.getElementById("status");
  status.textContent = "Session exported successfully!";
  status.style.color = "#2ecc71";
}

function triggerImport() {
  document.getElementById("import-file-input").click();
}

function importSession(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedSlots = JSON.parse(e.target.result);
      if (Array.isArray(importedSlots) && importedSlots.length > 0) {
        slots = importedSlots.map((slot, i) => ({
          ...createSlot(i + 1),
          ...slot,
          id: i + 1,
        }));
        renderAllSlots();
        broadcastState();
        const status = document.getElementById("status");
        status.textContent = "Session loaded successfully!";
        status.style.color = "#2ecc71";
      } else {
        alert("Invalid save file format.");
      }
    } catch (err) {
      alert("Failed to parse save file.");
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

function broadcastState() {
  const visibleItems = slots
    .filter((s) => (s.image || s.markdown) && s.visible)
    .map((s) => ({
      type: s.image ? "image" : "markdown",
      image: s.image,
      markdown: s.markdown,
      caption: s.caption,
    }));
  channel.postMessage({ type: "sync", items: visibleItems });
}
