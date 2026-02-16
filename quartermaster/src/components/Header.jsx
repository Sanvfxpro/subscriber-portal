
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Header = () => {
    const headerRef = useRef(null);

    useEffect(() => {
        gsap.fromTo(headerRef.current,
            { y: -100, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.2 }
        );
    }, []);

    return (
        <header ref={headerRef} className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between mix-blend-difference text-white">
            <div className="flex items-center gap-12">
                <a href="/" className="text-xl font-bold tracking-tight">QUARTERMASTER</a>
                <nav className="hidden md:flex gap-8 text-sm font-medium">
                    {['Product', 'Mariners', 'About', 'Blog'].map((item) => (
                        <a key={item} href={`/${item.toLowerCase()}`} className="hover:opacity-70 transition-opacity">
                            {item}
                        </a>
                    ))}
                </nav>
            </div>
            <button className="bg-accent hover:bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors">
                Get in Touch
            </button>
        </header>
    );
};

export default Header;
