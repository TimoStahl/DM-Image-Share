const INITIAL_SLOTS = 5;
const SLOTS_PER_ROW = 5;
let slots = [];

function createSlot(id) {
  return { id, image: null, caption: "", visible: false };
}

function buildSlotCard(i) {
  const container = document.getElementById("slots-container");
  const card = document.createElement("div");
  card.className = "slot-card";
  card.id = `slot-card-${i}`;
  card.dataset.slot = i;
  card.tabIndex = 0;
  card.innerHTML = `
        <div class="slot-header">Slot ${i}</div>
        <div class="thumb-preview" id="thumb-${i}">No Image Loaded</div>
        <input type="text" class="caption-input" id="caption-${i}" placeholder="Enter caption..." oninput="updateCaption(${i}, this.value)" disabled>
        <div class="slot-controls">
            <button class="slot-btn toggle-btn" id="toggle-${i}" onclick="toggleSlot(${i}, event)" disabled>Show</button>
            <button class="slot-btn remove-btn" id="remove-${i}" onclick="clearSlot(${i}, event)" disabled>Remove</button>
        </div>
    `;
  container.appendChild(card);
  setupBoxListeners(card, i);
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
    if (files.length > 0) {
      processImageFile(files[0], slotId);
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
  const removeBtn = document.getElementById(`remove-${slotId}`);
  const captionInput = document.getElementById(`caption-${slotId}`);
  if (slot.image) {
    card.classList.add("has-image");
    thumb.innerHTML = `<img src="${slot.image}" alt="Thumbnail">`;
    toggleBtn.disabled = false;
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

function toggleSlot(slotId, event) {
  if (event) event.stopPropagation();
  const idx = slotId - 1;
  if (!slots[idx].image) return;
  slots[idx].visible = !slots[idx].visible;
  updateSlotUI(slotId);
  broadcastState();
}

function clearSlot(slotId, event) {
  if (event) event.stopPropagation();
  const idx = slotId - 1;
  slots[idx].image = null;
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
    .filter((s) => s.image && s.visible)
    .map((s) => ({ image: s.image, caption: s.caption }));
  channel.postMessage({ type: "sync", items: visibleItems });
}
