let currentRenderTaskId = 0;
let previousImageKeys = new Set();

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

const MARKDOWN_ASPECT_RATIO = 1.3;

function getItemKey(item) {
  return item.type === "markdown" ? `md:${item.markdown}` : `img:${item.image}`;
}

const ROW_GAP = 20;
const IMG_GAP = 20;

function getContainerAvailableSize() {
  const container = document.getElementById("display-container");
  const rect = container.getBoundingClientRect();
  const cs = getComputedStyle(container);
  const paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  return { width: rect.width - paddingX, height: rect.height - paddingY };
}

// Area actually covered by images (object-fit: contain) if grouped items[start..end] form one row.
function computeRowUsedArea(items, start, end, rowWidth, rowHeight) {
  const count = end - start + 1;
  const availWidth = rowWidth - (count - 1) * IMG_GAP;
  let ratioSum = 0;
  for (let i = start; i <= end; i++) ratioSum += items[i].ratio;

  let used = 0;
  for (let i = start; i <= end; i++) {
    const ratio = items[i].ratio;
    const boxWidth = (ratio / ratioSum) * availWidth;
    const boxAspect = boxWidth / rowHeight;
    const imgWidth = boxAspect > ratio ? rowHeight * ratio : boxWidth;
    const imgHeight = boxAspect > ratio ? rowHeight : boxWidth / ratio;
    used += imgWidth * imgHeight;
  }
  return used;
}

// Best contiguous split of items into exactly numRows rows, maximizing displayed image area.
function partitionIntoRows(items, numRows, containerWidth, containerHeight) {
  const n = items.length;
  const rowHeight = (containerHeight - (numRows - 1) * ROW_GAP) / numRows;
  if (rowHeight <= 0) return null;

  const dp = Array.from({ length: numRows + 1 }, () =>
    new Array(n + 1).fill(-Infinity),
  );
  const split = Array.from({ length: numRows + 1 }, () =>
    new Array(n + 1).fill(-1),
  );
  dp[0][0] = 0;

  for (let row = 1; row <= numRows; row++) {
    for (let i = row; i <= n; i++) {
      for (let m = row - 1; m < i; m++) {
        if (dp[row - 1][m] === -Infinity) continue;
        const value =
          dp[row - 1][m] +
          computeRowUsedArea(items, m, i - 1, containerWidth, rowHeight);
        if (value > dp[row][i]) {
          dp[row][i] = value;
          split[row][i] = m;
        }
      }
    }
  }

  if (dp[numRows][n] === -Infinity) return null;

  const rows = [];
  let i = n;
  for (let row = numRows; row >= 1; row--) {
    const m = split[row][i];
    rows.unshift(items.slice(m, i));
    i = m;
  }
  return { rows, usedArea: dp[numRows][n] };
}

// Picks the row grouping (1..4 rows) that maximizes total displayed image area.
function getOptimalRows(items, containerWidth, containerHeight) {
  const n = items.length;
  if (n <= 1) return [items];

  let best = null;
  const maxRows = Math.min(4, n);
  for (let numRows = 1; numRows <= maxRows; numRows++) {
    const result = partitionIntoRows(
      items,
      numRows,
      containerWidth,
      containerHeight,
    );
    if (result && (!best || result.usedArea > best.usedArea)) {
      best = result;
    }
  }
  return best ? best.rows : [items];
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
      if (item.type === "markdown") {
        return { ...item, ratio: MARKDOWN_ASPECT_RATIO };
      }
      const ratio = await getImageAspectRatio(item.image);
      return { ...item, ratio };
    }),
  );

  if (taskId !== currentRenderTaskId) return;

  const { width, height } = getContainerAvailableSize();
  const rowsData = getOptimalRows(itemsWithRatios, width, height);

  const currentImageKeys = new Set(itemsWithRatios.map(getItemKey));

  rowsData.forEach((rowData) => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "player-row";

    rowData.forEach((item) => {
      const isNew = !previousImageKeys.has(getItemKey(item));

      const wrapper = document.createElement("div");
      wrapper.className = isNew
        ? "player-img-wrapper is-new"
        : "player-img-wrapper";
      wrapper.style.flex = `${item.ratio} 1 0%`;

      if (item.type === "markdown") {
        const mdBox = document.createElement("div");
        mdBox.className = "player-markdown";
        mdBox.innerHTML = DOMPurify.sanitize(marked.parse(item.markdown || ""));
        wrapper.appendChild(mdBox);
      } else {
        const img = document.createElement("img");
        img.className = "player-img";
        img.src = item.image;
        wrapper.appendChild(img);
      }

      if (item.caption && item.caption.trim() !== "") {
        const caption = document.createElement("div");
        caption.className = isNew ? "player-caption is-new" : "player-caption";
        caption.textContent = item.caption;
        wrapper.appendChild(caption);
      }

      rowDiv.appendChild(wrapper);
    });

    container.appendChild(rowDiv);
  });

  previousImageKeys = currentImageKeys;
}
