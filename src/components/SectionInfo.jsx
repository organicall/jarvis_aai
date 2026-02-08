import React from 'react';
import { Info } from 'lucide-react';

const SectionInfo = ({ text }) => {
    return (
        <span className="relative inline-flex items-center ml-1.5 group">
            <span
                tabIndex={0}
                className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-500/80 text-slate-400 hover:text-white hover:border-slate-300 transition-colors cursor-help"
                aria-label="Section information"
            >
                <Info className="w-2.5 h-2.5" />
            </span>
            <div
                role="tooltip"
                className="pointer-events-none absolute z-50 w-64 max-h-32 overflow-y-auto rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300 shadow-xl opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 group-hover:pointer-events-auto whitespace-normal break-words normal-case font-normal text-left"
                style={{
                    fontSize: '11px',
                    lineHeight: '15px',
                    left: '100%',
                    top: '50%',
                    marginLeft: '8px',
                    transform: 'translateY(-50%)'
                }}
            >
                {text}
            </div>
        </span>
    );
};

export default SectionInfo;
