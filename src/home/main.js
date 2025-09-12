import { init, animate } from "./startupEffect.js";

const canvas = document.querySelector('#bg-canvas');
const title = document.querySelector('#title');
const buttons = document.querySelector('#buttons');
const generateBtn = document.querySelector('#generate')

const titleLoaded = new CustomEvent('titleLoaded');

// Startup Animation
init();
animate();

canvas.addEventListener('startupAnimationComplete', () => {
    // Title will fade in
    title.classList.remove('opacity-0');
    
    // Buttons will fade in
    buttons.classList.remove('opacity-0');
})

generateBtn.addEventListener('click', () => {
    window.location.href = 'src/canvas/canvas.html';
})