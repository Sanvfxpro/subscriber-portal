import './style.css'
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("hero-lightpass");
const context = canvas.getContext("2d");

const numFrames = 127; // Use 127 or 128 depending on last file index
const currentFrame = index => (
  `/assets/Assets/ezgif-frame-${index.toString().padStart(3, '0')}.png`
);

const images = [];
const sequence = {
  frame: 1
};

// Preload images
for (let i = 1; i <= numFrames; i++) {
  const img = new Image();
  img.src = currentFrame(i);
  images.push(img);
  if (i === 1) {
    img.onload = () => {
      resize(); // Initial render
      // Ensure initial frame is drawn even behind the black overlay
    };
  }
}

// Master Timeline
// We attach one timeline to the scroll track
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".scroll-track", // Use the tall div as trigger
    start: "top top",
    end: "bottom bottom",
    scrub: 0.1, // Smooth scrubbing
    // no pin needed here because elements are position: fixed
  }
});

// Phase 1: Reveal from Black
// Fade out the overlay in the first 15% of the scroll
tl.to(".intro-overlay", {
  autoAlpha: 0,
  duration: 0.15,
  ease: "power1.inOut"
});

// Phase 2: Animate Sequence
// Animate frames for the remaining 85%
tl.to(sequence, {
  frame: numFrames,
  snap: "frame",
  ease: "none",
  duration: 0.85,
  onUpdate: render
}, ">"); // Start immediately after overlay fade


function render() {
  const index = Math.min(Math.max(Math.round(sequence.frame) - 1, 0), numFrames - 1);
  const img = images[index];

  if (img && img.complete && img.naturalWidth > 0) {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    // Cover logic
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      drawHeight = canvasHeight;
      drawWidth = imgRatio * canvasHeight;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    }

    context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render();
}

window.addEventListener('resize', resize);
resize();
