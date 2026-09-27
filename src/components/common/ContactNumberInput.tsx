import React, { useEffect, useState } from 'react';

export const CONTACT_NUMBER_ERROR_MESSAGE =
  'Please enter a valid 10-digit Philippine mobile number (e.g. 917 123 4567).';

/**
 * Philippine mobile number validation.
 *
 * IMPORTANT:
 * The +63 country code is NOT included in the 10 digits.
 *
 * Valid:
 *   9171234567
 *   +63 917 123 4567
 *
 * Invalid:
 *   09171234567
 *   639171234567
 *   917123456
 *   91712345678
 */
export const isValidContactNumber = (val: string): boolean => {
  if (!val) return false;

  let digits = val.replace(/\D/g, '');

  if (digits.startsWith('63')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits.length === 10 && /^9\d{9}$/.test(digits);
};

interface ContactNumberInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  errorOverride?: string | null;
  disabled?: boolean;
}

export const ContactNumberInput: React.FC<ContactNumberInputProps> = ({
  id,
  value,
  onChange,
  label = 'Contact Number',
  required = false,
  placeholder = '9171234567',
  helpText = 'Enter exactly 10 digits after +63.',
  errorOverride,
  disabled = false,
}) => {
  const [touched, setTouched] = useState(false);

  /**
   * Always convert the current value to the
   * 10-digit local Philippine mobile number.
   */
  const getLocalDigits = (input: string): string => {
    let digits = input.replace(/\D/g, '');

    // Remove +63 / 63.
    if (digits.startsWith('63')) {
      digits = digits.slice(2);
    }

    // Remove local 0.
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    // EXACTLY 10 digits maximum.
    return digits.slice(0, 10);
  };

  const currentDigits = getLocalDigits(value);

  const isValid = isValidContactNumber(currentDigits);

  const error =
    errorOverride !== undefined
      ? errorOverride
      : touched && !isValid
      ? CONTACT_NUMBER_ERROR_MESSAGE
      : null;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let digits = event.target.value.replace(/\D/g, '');

    // If user pastes +63XXXXXXXXXX, remove 63.
    if (digits.startsWith('63')) {
      digits = digits.slice(2);
    }

    // If user enters 09XXXXXXXXX, remove 0.
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    // NEVER allow more than 10 local digits.
    digits = digits.slice(0, 10);

    onChange(digits);

    if (!touched) {
      setTouched(true);
    }
  };

  useEffect(() => {
    // Keep component behavior synchronized with externally changed values.
    if (value && !touched) {
      const digits = getLocalDigits(value);

      if (digits.length === 10) {
        setTouched(true);
      }
    }
  }, [value]);

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="block font-bold text-stone-700 mb-1"
      >
        {label}{' '}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div
        className={`flex items-center w-full rounded-xl border bg-white overflow-hidden transition ${
          error
            ? 'border-red-400 ring-1 ring-red-200'
            : isValid
            ? 'border-emerald-400 ring-1 ring-emerald-100'
            : 'border-stone-300 focus-within:ring-2 focus-within:ring-emerald-600'
        }`}
      >
        {/* Fixed country code */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-stone-100 border-r border-stone-300 text-sm font-bold text-stone-700 shrink-0">
          <span>🇵🇭</span>
          <span>+63</span>
        </div>

        {/* 10-digit local number */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          pattern="9[0-9]{9}"
          autoComplete="tel-national"
          maxLength={10}
          disabled={disabled}
          value={currentDigits}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          required={required}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-3 py-2.5 outline-none bg-white text-stone-800 font-semibold tracking-wide"
          aria-invalid={!!error}
          aria-describedby={`${id}-help`}
        />

        {/* Validation indicator */}
        <div className="px-3 shrink-0">
          {isValid ? (
            <span className="text-emerald-600 font-black text-lg">✓</span>
          ) : (
            <span className="text-stone-300 text-sm">10</span>
          )}
        </div>
      </div>

      {/* Digit counter */}
      <div className="flex items-center justify-between mt-1">
        <p
          id={`${id}-help`}
          className={`text-[10px] ${
            error
              ? 'text-red-600'
              : isValid
              ? 'text-emerald-600'
              : 'text-stone-500'
          }`}
        >
          {error || helpText}
        </p>

        <span
          className={`text-[10px] font-bold ${
            isValid ? 'text-emerald-600' : 'text-stone-400'
          }`}
        >
          {currentDigits.length}/10
        </span>
      </div>
    </div>
  );
};

export default ContactNumberInput;
