document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('hero-canvas');
    const context = canvas.getContext('2d');
    const scrollContainer = document.querySelector('.scroll-container');
    const stickyWrapper = document.querySelector('.sticky-wrapper');
    const progressBar = document.querySelector('.progress-bar');
    const contentSection = document.querySelector('.content-section');
    const scrollIndicator = document.querySelector('.scroll-indicator');

    // Configuration
    const frameCount = 120; // Number of frames in the sequence
    const images = [];
    const sequenceLengthvh = 300; // Length of scroll in vh
    
    // Resize canvas to full screen
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderFrame(currentFrameIndex); // Re-render current frame on resize
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ---------------------------------------------------------
    // GENERATE DUMMY FRAMES (Replace with real image loading)
    // ---------------------------------------------------------
    function generateFrames() {
        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            // creating a dummy canvas to draw the "frame"
            const buffer = document.createElement('canvas');
            buffer.width = 1920; 
            buffer.height = 1080;
            const ctx = buffer.getContext('2d');
            
            // Draw background (dark fading to lighter or shifting hue)
            const progress = i / frameCount;
            // E.g. shifting from dark blue/black to... something else? 
            // Let's keep it abstract: grid lines moving, simple shapes
            
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, 1920, 1080);
            
            // Draw a moving circle
            ctx.beginPath();
            const x = 960 + Math.sin(progress * Math.PI * 2) * 400;
            const y = 540 + Math.cos(progress * Math.PI * 4) * 200;
            const radius = 50 + progress * 200;
            
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${100 + progress * 60}, 100%, 50%)`; // Lime to Greenish
            ctx.fill();
            
            // Draw frame number
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.font = '800 300px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${i + 1}`, 960, 540);

            img.src = buffer.toDataURL();
            images.push(img);
        }
        // Ensure first frame is loaded
        images[0].onload = () => renderFrame(0);
    }

    generateFrames();


    // ---------------------------------------------------------
    // RENDER LOGIC
    // ---------------------------------------------------------
    let currentFrameIndex = 0;

    function renderFrame(index) {
        if (index >= 0 && index < frameCount && images[index]) {
            // Draw image to cover canvas (like object-fit: cover)
            const img = images[index];
            
            const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
            const centerShift_x = (canvas.width - img.width * ratio) / 2;
            const centerShift_y = (canvas.height - img.height * ratio) / 2;
            
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(
                img, 
                0, 0, img.width, img.height,
                centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
            );
        }
    }

    // ---------------------------------------------------------
    // SCROLL LOOP
    // ---------------------------------------------------------
    function handleScroll() {
        const scrollTop = window.scrollY;
        const maxScroll = scrollContainer.offsetHeight - window.innerHeight;
        const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));

        // Update Progress Bar
        progressBar.style.width = `${scrollFraction * 100}%`;

        // Hide scroll indicator once user starts scrolling
        if (scrollTop > 50) {
            scrollIndicator.style.opacity = '0';
        } else {
            scrollIndicator.style.opacity = '1';
        }

        // PHASE 1: SEQUENCE PLAYBACK
        // Map scroll fraction (0 to ~0.8) to frame index
        // We leave the last 20% of scroll for the exit transition
        const playbackEndFraction = 0.8; 
        
        if (scrollFraction <= playbackEndFraction) {
             const frameProgress = scrollFraction / playbackEndFraction;
             const frameIndex = Math.min(
                 frameCount - 1,
                 Math.floor(frameProgress * frameCount)
             );
             
             if (frameIndex !== currentFrameIndex) {
                 currentFrameIndex = frameIndex;
                 requestAnimationFrame(() => renderFrame(currentFrameIndex));
             }
             
             // Reset exit transition if scrolling back up
             stickyWrapper.style.transform = `translateY(0)`;
             contentSection.classList.remove('visible');
        } 
        
        // PHASE 2: EXIT & REVEAL
        else {
            // Hold the last frame
            if (currentFrameIndex !== frameCount - 1) {
                currentFrameIndex = frameCount - 1;
                requestAnimationFrame(() => renderFrame(currentFrameIndex));
            }

            // Calculate exit progress
            // contentFraction goes from 0 to 1 as scrollFraction goes from 0.8 to 1.0
            const exitStart = playbackEndFraction; 
            const exitProgress = (scrollFraction - exitStart) / (1 - exitStart);
            
            // Move the canvas up (paralax or curtain effect)
            // We want it to move completely out of view (-100%)
            // But let's trigger it based on a threshold to make it "snap" or smooth transition
            
            // Actually, let's allow it to scroll naturally relative to viewport if we unpin it?
            // "The sequence reaches its final frame, the entire canvas slides upward"
            
            // We mimic this by translating the sticky wrapper
            // -100% means it moves up exactly one viewport height
            const translateY = exitProgress * -100;
            stickyWrapper.style.transform = `translateY(${translateY}%)`;

            // Trigger content reveal animations when we are partly into the transition
            if (exitProgress > 0.2) {
                contentSection.classList.add('visible');
            } else {
                 contentSection.classList.remove('visible');
            }
        }
    }

    window.addEventListener('scroll', () => {
        requestAnimationFrame(handleScroll);
    });

});
