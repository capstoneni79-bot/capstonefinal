import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Phone } from 'lucide-react';

export const CONTACT_NUMBER_ERROR_MESSAGE = 'Please enter a valid 10-digit Philippine mobile number (e.g. 917 123 4567).';

export interface ContactNumberInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  showStatusIndicator?: boolean;
  className?: string;
  errorOverride?: string | null;
  onValidate?: (isValid: boolean) => void;
}

/**
 * Validates that the input represents a valid Philippine mobile number (10 digits starting with 9, or with 09 / +63)
 */
export const isValidContactNumber = (val: string): boolean => {
  if (!val) return false;
  const digits = val.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('9')) return true;
  if (digits.length === 11 && digits.startsWith('09')) return true;
  if (digits.length === 12 && digits.startsWith('639')) return true;
  return false;
};

export const ContactNumberInput: React.FC<ContactNumberInputProps> = ({
  id = 'farmer-contact-number',
  value,
  onChange,
  label = 'Contact Number',
  required = true,
  placeholder = '917 123 4567',
  helpText,
  disabled = false,
  showStatusIndicator = true,
  className = '',
  errorOverride,
  onValidate,
}) => {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract clean 10-digit portion for display if prefix is already +63 or 09
  const getDisplayDigits = (raw: string) => {
    let d = (raw || '').replace(/\D/g, '');
    if (d.startsWith('63')) {
      d = d.slice(2);
    }
    d = d.replace(/^0+/, '');
    return d.slice(0, 10);
  };

  const currentDigits = getDisplayDigits(value);
  const isValid = isValidContactNumber(value) || (currentDigits.length === 10 && currentDigits.startsWith('9'));

  useEffect(() => {
    if (onValidate) {
      onValidate(isValid);
    }
  }, [isValid, onValidate]);

  // Sync validation error
  useEffect(() => {
    if (errorOverride !== undefined) {
      setInternalError(errorOverride);
    } else if (touched) {
      if (!isValid && (required || value.trim().length > 0)) {
        setInternalError(CONTACT_NUMBER_ERROR_MESSAGE);
      } else {
        setInternalError(null);
      }
    }
  }, [value, touched, isValid, errorOverride, required]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow keyboard navigation & commands
    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'].includes(
        e.key
      )
    ) {
      return;
    }

    // Only allow digits 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setTouched(true);
      setInternalError(CONTACT_NUMBER_ERROR_MESSAGE);
      return;
    }

    const target = e.currentTarget;
    const rawVal = getDisplayDigits(target.value);
    const hasSelection = (target.selectionEnd || 0) - (target.selectionStart || 0) > 0;
    if (rawVal.length >= 10 && !hasSelection) {
      e.preventDefault();
      setTouched(true);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setTouched(true);

    const pastedText = e.clipboardData.getData('text') || '';
    let digits = pastedText.replace(/\D/g, '');
    if (digits.startsWith('63')) {
      digits = digits.slice(2);
    }
    digits = digits.replace(/^0+/, '');
    const clean10 = digits.slice(0, 10);
    const formatted = clean10 ? `+63 ${clean10}` : '';
    onChange(formatted);

    if (clean10.length !== 10 || !clean10.startsWith('9')) {
      setInternalError(CONTACT_NUMBER_ERROR_MESSAGE);
    } else {
      setInternalError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawVal = e.target.value.replace(/\D/g, '');
    if (rawVal.startsWith('63')) {
      rawVal = rawVal.slice(2);
    }
    rawVal = rawVal.replace(/^0+/, '');
    const clean10 = rawVal.slice(0, 10);
    const formatted = clean10 ? `+63 ${clean10}` : '';
    onChange(formatted);

    if (touched) {
      if (clean10.length !== 10 || !clean10.startsWith('9')) {
        setInternalError(CONTACT_NUMBER_ERROR_MESSAGE);
      } else {
        setInternalError(null);
      }
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (!isValid && (required || value.trim().length > 0)) {
      setInternalError(CONTACT_NUMBER_ERROR_MESSAGE);
    } else {
      setInternalError(null);
    }
  };

  const activeError = errorOverride || (touched && !isValid && (required || value.trim().length > 0) ? CONTACT_NUMBER_ERROR_MESSAGE : internalError);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block font-bold text-stone-700 text-xs">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {showStatusIndicator && (
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold transition ${
              isValid
                ? 'bg-emerald-100 text-emerald-800'
                : currentDigits.length > 0
                ? 'bg-amber-100 text-amber-800'
                : 'text-stone-400'
            }`}
          >
            {currentDigits.length}/10 digits (+63)
          </span>
        )}
      </div>

      <div className="relative flex rounded-xl border overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-emerald-600">
        {/* Country Code Prefix Badge */}
        <div className="bg-stone-100 border-r border-stone-300 px-3 py-2 flex items-center gap-1.5 shrink-0 select-none text-xs font-bold text-stone-700">
          <span className="text-sm">🇵🇭</span>
          <span className="font-mono text-emerald-900">+63</span>
          <span className="text-stone-300">|</span>
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]{10}"
          autoComplete="tel-national"
          maxLength={10}
          disabled={disabled}
          value={currentDigits}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`flex-1 px-3.5 py-2.5 text-xs font-mono font-medium transition focus:outline-hidden ${
            activeError
              ? 'bg-red-50/20 text-red-950'
              : isValid
              ? 'bg-emerald-50/10 text-emerald-950'
              : 'bg-white text-stone-900'
          } disabled:bg-stone-100 disabled:text-stone-500`}
        />

        <div className="pr-3 flex items-center gap-1.5 pointer-events-none bg-white">
          {isValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : activeError ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <Phone className="w-3.5 h-3.5 text-stone-400" />
          )}
        </div>
      </div>

      {activeError ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1.5 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
          <span>{CONTACT_NUMBER_ERROR_MESSAGE}</span>
        </p>
      ) : helpText ? (
        <p className="text-[11px] text-stone-500 mt-1">{helpText}</p>
      ) : null}
    </div>
  );
};
