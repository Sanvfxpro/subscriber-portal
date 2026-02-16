
import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-surface px-6 md:px-20 py-16 border-t border-white/5">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">

                <div>
                    <h2 className="text-2xl font-bold mb-6">QUARTERMASTER</h2>
                    <div className="flex flex-col gap-2 text-secondary text-sm">
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>

                <div className="flex gap-8">
                    <a href="#" className="text-secondary hover:text-white transition-colors text-sm">Twitter / X</a>
                    <a href="#" className="text-secondary hover:text-white transition-colors text-sm">LinkedIn</a>
                    <a href="#" className="text-secondary hover:text-white transition-colors text-sm">Instagram</a>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 text-center md:text-left text-xs text-gray-500">
                © {new Date().getFullYear()} Quartermaster. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
