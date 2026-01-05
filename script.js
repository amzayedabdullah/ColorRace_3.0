const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const upload = document.getElementById("upload");
const zoomInput = document.getElementById("zoom");
const download = document.getElementById("download");

const frame = new Image();
frame.src = "Asset 1@4x.png";

const SIZE = canvas.width;
const RADIUS = SIZE / 2;

let img = null;
let baseScale = 1;
let userScale = 1;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let startX, startY;

// Mobile detection
const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
if (isMobile) zoomInput.step = 0.02;

// Cover-scale (Convocation-style)
function calculateCoverScale(image) {
  return Math.max(SIZE / image.width, SIZE / image.height);
}

// Draw canvas
function draw() {
  ctx.clearRect(0, 0, SIZE, SIZE);
  if (!img) return;

  const scale = baseScale * userScale;
  const drawW = img.width * scale;
  const drawH = img.height * scale;

  ctx.save();
  ctx.beginPath();
  ctx.arc(RADIUS, RADIUS, RADIUS, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(
    img,
    RADIUS + offsetX - drawW / 2,
    RADIUS + offsetY - drawH / 2,
    drawW,
    drawH
  );

  ctx.restore();
  ctx.drawImage(frame, 0, 0, SIZE, SIZE);
}

// Smart face centering
async function smartCenterFace(image) {
  if (!("FaceDetector" in window)) return;

  try {
    const detector = new FaceDetector({ fastMode: true });
    const faces = await detector.detect(image);
    if (!faces.length) return;

    const face = faces[0].boundingBox;
    const faceCenterX = face.x + face.width / 2;
    const faceCenterY = face.y + face.height / 2;

    offsetX = -(faceCenterX - image.width / 2) * baseScale;
    offsetY = -(faceCenterY - image.height / 2) * baseScale;
  } catch {}
}

// Upload
upload.addEventListener("change", e => {
  img = new Image();
  img.onload = async () => {
    baseScale = calculateCoverScale(img);
    userScale = 1;
    zoomInput.value = 1;
    offsetX = 0;
    offsetY = 0;
    await smartCenterFace(img);
    draw();
  };
  img.src = URL.createObjectURL(e.target.files[0]);
});

// Zoom
zoomInput.addEventListener("input", () => {
  userScale = parseFloat(zoomInput.value);
  draw();
});

// Drag
canvas.addEventListener("mousedown", e => {
  dragging = true;
  startX = e.clientX;
  startY = e.clientY;
  canvas.style.cursor = "grabbing";
});

window.addEventListener("mouseup", () => {
  dragging = false;
  canvas.style.cursor = "grab";
});

window.addEventListener("mousemove", e => {
  if (!dragging || !img) return;
  offsetX += e.clientX - startX;
  offsetY += e.clientY - startY;
  startX = e.clientX;
  startY = e.clientY;
  draw();
});

// Export (HD / Ultra HD)
download.addEventListener("click", async () => {
  if (!img) return;

  const size = Number(
    document.querySelector('input[name="quality"]:checked').value
  );

  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const octx = out.getContext("2d");

  const scale = baseScale * userScale * (size / SIZE);
  const drawW = img.width * scale;
  const drawH = img.height * scale;

  octx.beginPath();
  octx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  octx.clip();

  octx.drawImage(
    img,
    size / 2 + offsetX * (size / SIZE) - drawW / 2,
    size / 2 + offsetY * (size / SIZE) - drawH / 2,
    drawW,
    drawH
  );

  octx.restore();
  octx.drawImage(frame, 0, 0, size, size);

  const link = document.createElement("a");
  link.download = `uiu-app-forum-dp-${size}.png`;
  link.href = out.toDataURL("image/png", 1.0);
  link.click();
});
