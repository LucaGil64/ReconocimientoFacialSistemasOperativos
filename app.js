const video = document.getElementById('video');
const btnRegister = document.getElementById('btn-register');
const btnLogin = document.getElementById('btn-login');
const statusText = document.getElementById('status');

// Aquí guardaremos en memoria la firma biométrica del usuario registrado
let savedFaceDescriptor = null;

// 1. Cargar los modelos pre-entrenados
// Asumimos que los modelos están en una carpeta llamada "models" en la raíz del proyecto
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
]).then(startVideo).catch(err => {
    console.error(err);
    statusText.innerText = "Error al cargar los modelos. Revisa la consola y asegúrate de tener la carpeta /models.";
    statusText.style.color = "#f38ba8"; // Rojo
});

// 2. Iniciar la cámara web
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
            statusText.innerText = "Cámara activada. Listo para guardar tu perfil.";
            statusText.style.color = "#a6e3a1"; // Verde
            btnRegister.disabled = false;
        })
        .catch(err => {
            console.error(err);
            statusText.innerText = "Error al acceder a la cámara. Por favor otorga los permisos.";
            statusText.style.color = "#f38ba8";
        });
}

// 3. Lógica para GUARDAR EL ROSTRO (Registro)
btnRegister.addEventListener('click', async () => {
    statusText.innerText = "Escaneando rostro... mantente quieto.";
    statusText.style.color = "#f9e2af"; // Amarillo

    // Detectar una sola cara usando la cámara
    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (detection) {
        // Guardamos el "descriptor" (array de 128 valores que identifica la cara)
        savedFaceDescriptor = detection.descriptor;
        
        statusText.innerText = "¡Perfil guardado con éxito! Ahora puedes probar el acceso.";
        statusText.style.color = "#a6e3a1";
        btnLogin.disabled = false; // Habilitamos el botón de login
    } else {
        statusText.innerText = "No se detectó ninguna cara. Ilumina bien tu rostro y mira a la cámara.";
        statusText.style.color = "#f38ba8";
    }
});

// 4. Lógica para INICIAR SESIÓN (Validación)
btnLogin.addEventListener('click', async () => {
    if (!savedFaceDescriptor) return;

    statusText.innerText = "Verificando identidad...";
    statusText.style.color = "#f9e2af";

    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (detection) {
        // Comparamos el descriptor actual con el guardado previamente
        // Se utiliza la Distancia Euclidiana. Un valor menor significa mayor similitud.
        const distance = faceapi.euclideanDistance(savedFaceDescriptor, detection.descriptor);

        // Generalmente una distancia menor a 0.5 o 0.6 se considera la misma persona
        if (distance < 0.55) {
            statusText.innerText = "✅ ACCESO CONCEDIDO. Identidad verificada.";
            statusText.style.color = "#a6e3a1";
        } else {
            statusText.innerText = "❌ ACCESO DENEGADO. Rostro no reconocido.";
            statusText.style.color = "#f38ba8";
        }
    } else {
        statusText.innerText = "No se detectó ninguna cara frente a la cámara.";
        statusText.style.color = "#fab387"; // Naranja
    }
});