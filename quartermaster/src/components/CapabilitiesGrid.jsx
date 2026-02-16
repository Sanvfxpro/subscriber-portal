
import React, { useEffect, useRef } from 'react';
import { Ship, Anchor, Map, Navigation, Shield, Database } from 'lucide-react';
import gsap from 'gsap';

const features = [
    {
        icon: Ship,
        title: "Vessel Management",
        desc: "Real-time tracking of vessel location, status, and performance metrics."
    },
    {
        icon: Map,
        title: "Intelligent Routing",
        desc: "AI-powered course plotting that optimizes for efficiency and safety."
    },
    {
        icon: Anchor,
        title: "Port Logistics",
        desc: "Seamless integration with port authorities for streamlined docking."
    },
    {
        icon: Database,
        title: "Digital Logbooks",
        desc: "Automated, tamper-proof record keeping for all maritime operations."
    },
    {
        icon: Navigation,
        title: "Crew Scheduling",
        desc: "Smart rostering tools to ensure compliance and crew well-being."
    },
    {
        icon: Shield,
        title: "Safety & Compliance",
        desc: "Automated checks against international maritime regulations."
    }
];

const CapabilitiesGrid = () => {
    const gridRef = useRef(null);

    useEffect(() => {
        const cards = gridRef.current.children;

        gsap.fromTo(cards,
            { y: 100, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: gridRef.current,
                    start: 'top 80%',
                }
            }
        );
    }, []);

    return (
        <section className="px-6 md:px-20 py-32 bg-background">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-20 tracking-tight">Capabilities</h2>

                <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-24">
                    {features.map((Feature, idx) => (
                        <div key={idx} className="group cursor-pointer">
                            <div className="mb-6 inline-block p-4 rounded-xl bg-surface group-hover:bg-accent transition-colors duration-300">
                                <Feature.icon className="w-8 h-8 text-accent group-hover:text-white transition-colors duration-300" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 group-hover:text-accent transition-colors">{Feature.title}</h3>
                            <p className="text-secondary text-lg leading-relaxed max-w-md">
                                {Feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CapabilitiesGrid;
