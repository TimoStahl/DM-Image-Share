let currentRenderTaskId = 0;

function setupPlayer() {
  channel.onmessage = function (event) {
    const msg = event.data;
    if (!msg) return;
    if (msg.type === "sync") {
      renderPlayerGrid(msg.items);
    } else if (msg.type === "blackout") {
      document.getElementById("blackout-overlay").style.display = msg.active
        ? "block"
        : "none";
    }
  };
}

function getImageAspectRatio(base64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
    img.onerror = () => resolve(1.0);
    img.src = base64;
  });
}

function getRowsDistribution(arr) {
  const n = arr.length;
  if (n <= 1) return [arr];

  const totalRatio = arr.reduce((sum, item) => sum + item.ratio, 0);

  let numRows = 1;
  if (n >= 3) {
    if (totalRatio <= 2.2) {
      numRows = 1; // Collapse portrait clusters
    } else if (totalRatio <= 4.5 && n <= 6) {
      numRows = 2;
    } else if (n <= 8) {
      numRows = 2;
    } else {
      numRows = 3;
    }
  }

  if (numRows === 1) return [arr];

  const result = [];
  let startIndex = 0;

  for (let r = 0; r < numRows; r++) {
    const remainingItems = n - startIndex;
    const remainingRows = numRows - r;
    const count = Math.ceil(remainingItems / remainingRows);
    if (count > 0) {
      result.push(arr.slice(startIndex, startIndex + count));
      startIndex += count;
    }
  }
  return result;
}

async function renderPlayerGrid(items) {
  const taskId = ++currentRenderTaskId;
  const container = document.getElementById("display-container");
  const placeholder = document.getElementById("player-placeholder");

  const currentWrappers = container.querySelectorAll(
    ".player-row, .player-img-wrapper",
  );
  currentWrappers.forEach((wrap) => wrap.remove());

  const itemsToShow = items.slice(0, 9);

  if (!itemsToShow || itemsToShow.length === 0) {
    placeholder.style.display = "block";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    return;
  }

  placeholder.style.display = "none";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.justifyContent = "center";
  container.style.alignItems = "center";
  container.style.gap = "20px";

  const itemsWithRatios = await Promise.all(
    itemsToShow.map(async (item) => {
      const ratio = await getImageAspectRatio(item.image);
      return { ...item, ratio };
    }),
  );

  if (taskId !== currentRenderTaskId) return;

  const rowsData = getRowsDistribution(itemsWithRatios);

  rowsData.forEach((rowData) => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "player-row";

    rowData.forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "player-img-wrapper";
      wrapper.style.flex = `${item.ratio} 1 0%`;

      const img = document.createElement("img");
      img.className = "player-img";
      img.src = item.image;
      wrapper.appendChild(img);

      if (item.caption && item.caption.trim() !== "") {
        const caption = document.createElement("div");
        caption.className = "player-caption";
        caption.textContent = item.caption;
        wrapper.appendChild(caption);
      }

      rowDiv.appendChild(wrapper);
    });

    container.appendChild(rowDiv);
  });
}
