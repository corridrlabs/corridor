import React from 'react';
import PhoneInput2 from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, className = '', placeholder = 'Enter phone number' }) => {
    return (
        <div className={`phone-input-container ${className}`}>
            <PhoneInput2
                country={'ke'} // Default to Kenya
                value={value}
                onChange={phone => onChange(`+${phone}`)}
                inputClass="!w-full !bg-slate-50 !border !border-slate-200 !rounded-xl !py-3.5 !pl-12 !pr-4 !text-slate-900 !placeholder-slate-400 focus:!outline-none focus:!ring-4 focus:!ring-blue-500/10 focus:!border-blue-500 !h-[52px] !font-medium"
                buttonClass="!bg-slate-50 !border-slate-200 !rounded-l-xl hover:!bg-slate-100"
                dropdownClass="!bg-white !text-slate-700 !border-slate-200 !shadow-xl"
                searchClass="!bg-slate-50 !text-slate-900 !border-slate-200"
                enableSearch={true}
                disableSearchIcon={false}
                placeholder={placeholder}
            />
            <style>{`
                .react-tel-input .flag-dropdown {
                    border-right: 1px solid #e2e8f0 !important;
                }
                .react-tel-input .selected-flag:hover, .react-tel-input .selected-flag:focus {
                    background-color: #f1f5f9 !important;
                }
                .react-tel-input .country-list .country:hover {
                    background-color: #f8fafc !important;
                }
                .react-tel-input .country-list .country.highlight {
                    background-color: #f1f5f9 !important;
                }
            `}</style>
        </div>
    );
};
