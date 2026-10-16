/// <reference types="vite/client" />

// Dichiarazione tipi per asset statici importati come moduli Vite
declare module '*.png' {
    const src: string;
    export default src;
}
declare module '*.jpg' {
    const src: string;
    export default src;
}
declare module '*.svg' {
    const src: string;
    export default src;
}
declare module '*.webp' {
    const src: string;
    export default src;
}
