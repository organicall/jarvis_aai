import React from 'react';
import { Info } from 'lucide-react';

const SectionInfo = ({ text }) => {
    return (
        <span className="relative inline-flex items-center group">
            <span
                tabIndex={0}
                className="ml-1.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-500/80 text-slate-400 hover:text-white hover:border-slate-300 transition-colors cursor-help"
                aria-label="Section information"
            >
                <Info className="w-2.5 h-2.5" />
            </span>
            <div
                role="tooltip"
                className="pointer-events-none absolute left-0 top-full mt-2 z-50 w-64 max-h-32 overflow-y-auto rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300 shadow-xl opacity-0 translate-y-1 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 whitespace-normal break-words"
                style={{ fontSize: '11px', lineHeight: '15px' }}
            >
                {text}
            </div>
        </span>
    );
};

export default SectionInfo;
