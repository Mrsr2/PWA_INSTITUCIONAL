const CACHE = 'campus-estudiantes-v2';

const ARCHIVOS = [
    './',
    'index.html',
    'style/style.css',
    'js/app.js',
    'manifest.json',
    'ico1.png',
    'ico4.png'
];

self.addEventListener( 'install', ( e ) => {
    e.waitUntil(
        caches.open( CACHE )
            .then( c => c.addAll( ARCHIVOS ) )
    );
    self.skipWaiting();
});

self.addEventListener('activate', ( e ) => {
    e.waitUntil(
        caches.keys()
        .then (keys => Promise.all( keys.filter( k => k !== CACHE ).map( k => caches.delete( k ) ) ) )
        .then( () => self.clients.claim() )
    );
});

self.addEventListener( 'fetch', ( e ) => {
    if( e.request.method !== 'GET' ) {
        return;
    }
    e.respondWith(
        caches.match( e.request )
            .then( cacheado => cacheado || fetch( e.request )
                .then( res => {
                    const copia = res.clone();
                    caches.open( CACHE )
                        .then ( c => c.put(e.request, copia ) );
                    return res;
                })).catch((()=> caches.match('index.html')))
    );
});