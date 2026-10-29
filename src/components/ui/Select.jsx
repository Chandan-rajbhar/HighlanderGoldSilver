import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const Select = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  triggerClassName = '',
  contentClassName = '',
  disabled = false,
  id,
  name,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse options if passed as children (<option value="X">Label</option>)
  const parsedOptions = React.useMemo(() => {
    if (options && options.length > 0) {
      return options.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
          return { value: opt.value, label: opt.label ?? opt.value };
        }
        return { value: opt, label: opt };
      });
    }

    if (children) {
      const opts = [];
      React.Children.forEach(children, child => {
        if (React.isValidElement(child) && child.type === 'option') {
          opts.push({
            value: child.props.value,
            label: child.props.children
          });
        }
      });
      return opts;
    }

    return [];
  }, [options, children]);

  const selectedOption = parsedOptions.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : (value || placeholder);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      // Support both direct value and synthetic event { target: { value: val, name: name } }
      const syntheticEvent = {
        target: { value: val, name: name || id },
        currentTarget: { value: val, name: name || id },
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      onChange(syntheticEvent);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button - Shadcn Style */}
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2.5 px-3 py-2 bg-white border border-[#DCE5F0] hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-xs hover:bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-[#071A35]/10 focus:border-[#071A35] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${triggerClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-700' : ''
          }`} 
        />
      </button>

      {/* Popover Content - Shadcn Style */}
      {isOpen && (
        <div 
          className={`absolute left-0 mt-1.5 min-w-[140px] w-full max-h-60 overflow-y-auto bg-white rounded-xl shadow-elevated border border-[#DCE5F0] p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 origin-top ${contentClassName}`}
          role="listbox"
        >
          {parsedOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-[#F5F8FC] text-slate-900 font-bold shadow-2xs' 
                    : 'text-slate-600 hover:bg-[#F5F8FC] hover:text-slate-900'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#071A35] shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

