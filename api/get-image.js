/*
    ARCHIVO: api/get-image.js
    DESCRIPCIÓN: Esta es tu función "serverless" (sin servidor). 
    Se ejecuta en el backend (por ejemplo, en Vercel) para proteger 
    tu clave de API y gestionar las peticiones eficientemente.
*/

// Usamos una variable simple para guardar la imagen en memoria (caché).
// Esto evita llamar a Unsplash en cada visita.
let cachedImage = {
    timestamp: 0, // La fecha en que se guardó la imagen.
    data: null      // Los datos de la imagen.
};

// Esta es la función principal que se ejecuta cuando un usuario visita tuweb.com/api/get-image
export default async function handler(req, res) {
    
    // IMPORTANTE: Pon tu clave de API de Unsplash aquí.
    // Al estar en el servidor, nadie más puede verla.
    const UNSPLASH_ACCESS_KEY = '_rA_cBSRPjqa6N1l16cJD1PyQX_K02AfqUfZ5CKxAXI';
    
    // Duración de la caché: 24 horas en milisegundos.
    const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; 
    const now = Date.now();

    // --- PASO 1: REVISAR SI TENEMOS UNA IMAGEN GUARDADA (CACHÉ) ---
    // Si tenemos una imagen y no ha pasado más de 24 horas, la devolvemos directamente.
    if (cachedImage.data && (now - cachedImage.timestamp < CACHE_DURATION_MS)) {
        console.log('Sirviendo imagen desde la caché (HIT)');
        // Respondemos al navegador con los datos guardados.
        res.status(200).json(cachedImage.data);
        return; // Terminamos la ejecución aquí.
    }

    // --- PASO 2: SI NO HAY IMAGEN EN CACHÉ, PEDIR UNA NUEVA A UNSPLASH ---
    console.log('La caché está vacía o es vieja. Pidiendo nueva imagen a Unsplash (MISS)');
    try {
        const topic = 'epic'; // Tema de la imagen. ¡Puedes cambiarlo!
        const apiUrl = `https://api.unsplash.com/photos/random?query=${topic}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
        
        const unsplashResponse = await fetch(apiUrl);
        if (!unsplashResponse.ok) {
            // Si Unsplash da un error, lo registramos y enviamos un error al usuario.
            throw new Error(`Error de la API de Unsplash: ${unsplashResponse.statusText}`);
        }
        const unsplashData = await unsplashResponse.json();

        // --- PASO 3: PREPARAMOS Y GUARDAMOS LA NUEVA IMAGEN ---
        // Extraemos solo la información que nos interesa.
        const imageData = {
            imageUrl: unsplashData.urls.regular,
            altText: unsplashData.alt_description,
            artistName: unsplashData.user.name,
            artistUrl: unsplashData.user.links.html
        };

        // Actualizamos nuestra caché con la nueva imagen y la fecha actual.
        cachedImage = {
            timestamp: now,
            data: imageData
        };
        
        // Enviamos la nueva imagen al usuario que la pidió.
        res.status(200).json(imageData);

    } catch (error) {
        // Si algo falla, lo mostramos en la consola del servidor y enviamos un error genérico.
        console.error('Error en la función serverless:', error);
        res.status(500).json({ error: 'No se pudo obtener la imagen desde Unsplash.' });
    }
}
