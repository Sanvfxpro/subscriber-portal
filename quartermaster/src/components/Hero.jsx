
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Hero = () => {
    const titleRef = useRef(null);
    const subRef = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline();
        tl.fromTo(titleRef.current,
            { y: 100, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', delay: 0.5 }
        )
            .fromTo(subRef.current,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
                "-=0.8"
            );
    }, []);

    return (
        <section className="relative h-screen flex flex-col justify-center items-start px-6 md:px-20 pt-20">
            <div className="max-w-4xl z-10">
                <h1 ref={titleRef} className="text-6xl md:text-8xl font-bold leading-[0.9] tracking-tighter mb-8">
                    The Operating System <br /> for the Modern Mariner.
                </h1>
                <p ref={subRef} className="text-xl md:text-2xl text-secondary max-w-2xl leading-relaxed">
                    Quartermaster unifies navigation, logs, and systems into one intuitive platform.
                </p>
            </div>

            {/* Background Graphic Placeholder */}
            <div className="absolute right-0 bottom-0 w-full md:w-2/3 h-2/3 opacity-30 pointer-events-none">
                <div className="w-full h-full bg-gradient-to-t from-background to-transparent absolute bottom-0 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1547623641-82fbb83476e9?q=80&w=2600&auto=format&fit=crop"
                    alt="Ocean Topography"
                    className="w-full h-full object-cover mix-blend-overlay"
                />
            </div>
        </section>
    );
};

export default Hero;
