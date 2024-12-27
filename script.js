const MIN_VOLUME_THRESHOLD = 100; // Umbral reducido para mayor sensibilidad
const MIN_TIME_BETWEEN_DETECTIONS = 1500; // Tiempo mínimo entre detecciones
const IMAGE_COUNT = 7; // Número total de imágenes en la carpeta, ajustable

let imageInterval;
let isRunning = false;
let lastDetectedTime = 0;

// Configuración del reconocimiento de sonido
async function setupSoundDetection() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    microphone.connect(analyser);

    const canvas = document.getElementById('frequencyMeter');
    const canvasCtx = canvas.getContext('2d');

    let frameCounter = 0;

    function detectBell() {
      frameCounter++;
      // Procesar un frame de cada dos para reducir la carga
      if (frameCounter % 2 === 0) {
        analyser.getByteFrequencyData(dataArray);
        drawFrequencyMeter(canvas, canvasCtx, dataArray);

        const highFrequencies = dataArray.slice(80, 250); // Ampliar rango de frecuencias
        const volume = calculateAverageVolume(highFrequencies);

        const currentTime = Date.now();

        if (
          volume > MIN_VOLUME_THRESHOLD &&
          currentTime - lastDetectedTime > MIN_TIME_BETWEEN_DETECTIONS
        ) {
          console.log("Sonido detectado: Deteniendo secuencia");
          stopLoop();
          lastDetectedTime = currentTime;
        }
      }
      requestAnimationFrame(detectBell);
    }

    detectBell();
  } catch (error) {
    alert("No se pudo acceder al micrófono. Por favor, verifica los permisos.");
    console.error("Error al acceder al micrófono:", error);
  }
}

// Dibuja el medidor de frecuencias en el canvas
function drawFrequencyMeter(canvas, canvasCtx, dataArray) {
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  canvasCtx.fillStyle = 'rgb(0, 0, 0)';
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  const barWidth = canvas.width / dataArray.length;
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = dataArray[i];
    canvasCtx.fillStyle = `rgb(${barHeight}, 50, 50)`;
    canvasCtx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
  }
}

// Calcula el volumen promedio de un rango de frecuencias
function calculateAverageVolume(dataArray) {
  return dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
}

// Inicia el bucle de cambio de imágenes
function startLoop() {
  if (!isRunning) {
    const photoElement = document.getElementById('photo');
    imageInterval = setInterval(() => showRandomImage(photoElement), 100);
    isRunning = true;
    console.log("Bucle iniciado.");
  }
}

// Detiene el bucle de cambio de imágenes
function stopLoop() {
  if (isRunning) {
    clearInterval(imageInterval);
    isRunning = false;
    console.log("Bucle detenido.");
  }
}

// Obtiene una imagen aleatoria desde la carpeta
function getRandomImage() {
  const randomIndex = Math.floor(Math.random() * IMAGE_COUNT) + 1;
  return `images/image${randomIndex}.jpg`;
}

// Muestra una imagen aleatoria en un elemento img
function showRandomImage(imgElement) {
  const randomImage = getRandomImage();
  if (randomImage) imgElement.src = randomImage;
}

// Configura el evento del botón para iniciar la secuencia
document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');
  startButton.addEventListener('click', startLoop);
});

// Inicia la detección de sonido cuando se carga la página
setupSoundDetection();
