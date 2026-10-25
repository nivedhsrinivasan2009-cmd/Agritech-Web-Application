// Form Validation Library for Gracia Visitor App

// Common validation patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)\/?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alpha: /^[a-zA-Z]+$/,
  numeric: /^[0-9]+$/,
  time24: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  date: /^\d{4}-\d{2}-\d{2}$/
};

// Validation rules
export const rules = {
  required: (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  email: (value) => {
    if (!value) return true; // Let required handle empty
    return patterns.email.test(value);
  },

  phone: (value) => {
    if (!value) return true;
    return patterns.phone.test(value);
  },

  url: (value) => {
    if (!value) return true;
    return patterns.url.test(value);
  },

  minLength: (min) => (value) => {
    if (!value) return true;
    return value.length >= min;
  },

  maxLength: (max) => (value) => {
    if (!value) return true;
    return value.length <= max;
  },

  min: (min) => (value) => {
    if (value === '' || value === null || value === undefined) return true;
    return Number(value) >= min;
  },

  max: (max) => (value) => {
    if (value === '' || value === null || value === undefined) return true;
    return Number(value) <= max;
  },

  between: (min, max) => (value) => {
    if (value === '' || value === null || value === undefined) return true;
    const num = Number(value);
    return num >= min && num <= max;
  },

  pattern: (regex) => (value) => {
    if (!value) return true;
    return regex.test(value);
  },

  match: (fieldName, fieldValue) => (value) => {
    return value === fieldValue;
  },

  date: (value) => {
    if (!value) return true;
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  futureDate: (value) => {
    if (!value) return true;
    const date = new Date(value);
    return date > new Date();
  },

  pastDate: (value) => {
    if (!value) return true;
    const date = new Date(value);
    return date < new Date();
  },

  time: (value) => {
    if (!value) return true;
    return patterns.time24.test(value);
  },

  password: (value) => {
    if (!value) return true;
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    const hasLength = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    return hasLength && hasUpper && hasLower && hasNumber;
  },

  custom: (validatorFn) => validatorFn
};

// Error messages
const defaultMessages = {
  required: '{field} is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  url: 'Please enter a valid URL',
  minLength: '{field} must be at least {min} characters',
  maxLength: '{field} must be no more than {max} characters',
  min: '{field} must be at least {min}',
  max: '{field} must be no more than {max}',
  between: '{field} must be between {min} and {max}',
  pattern: '{field} format is invalid',
  match: '{field} must match {matchField}',
  date: 'Please enter a valid date',
  futureDate: 'Date must be in the future',
  pastDate: 'Date must be in the past',
  time: 'Please enter a valid time (HH:MM)',
  password: 'Password must be at least 8 characters with uppercase, lowercase, and number'
};

// Format error message
function formatMessage(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

// Validate a single field
export function validateField(value, fieldRules, fieldName = 'Field') {
  const errors = [];

  for (const rule of fieldRules) {
    let isValid = true;
    let message = '';
    let params = { field: fieldName };

    if (typeof rule === 'string') {
      // Simple rule like 'required', 'email'
      if (rules[rule]) {
        isValid = rules[rule](value);
        message = defaultMessages[rule] || `${fieldName} is invalid`;
      }
    } else if (typeof rule === 'object') {
      // Rule with options like { rule: 'minLength', value: 5, message: 'Custom message' }
      const { rule: ruleName, message: customMessage, ...ruleParams } = rule;

      if (ruleName === 'minLength') {
        isValid = rules.minLength(ruleParams.value)(value);
        params.min = ruleParams.value;
      } else if (ruleName === 'maxLength') {
        isValid = rules.maxLength(ruleParams.value)(value);
        params.max = ruleParams.value;
      } else if (ruleName === 'min') {
        isValid = rules.min(ruleParams.value)(value);
        params.min = ruleParams.value;
      } else if (ruleName === 'max') {
        isValid = rules.max(ruleParams.value)(value);
        params.max = ruleParams.value;
      } else if (ruleName === 'between') {
        isValid = rules.between(ruleParams.min, ruleParams.max)(value);
        params.min = ruleParams.min;
        params.max = ruleParams.max;
      } else if (ruleName === 'pattern') {
        isValid = rules.pattern(ruleParams.value)(value);
      } else if (ruleName === 'match') {
        isValid = rules.match(ruleParams.field, ruleParams.value)(value);
        params.matchField = ruleParams.field;
      } else if (ruleName === 'custom') {
        isValid = ruleParams.validator(value);
      } else if (rules[ruleName]) {
        isValid = rules[ruleName](value);
      }

      message = customMessage || defaultMessages[ruleName] || `${fieldName} is invalid`;
    } else if (typeof rule === 'function') {
      // Custom validator function
      isValid = rule(value);
      message = `${fieldName} is invalid`;
    }

    if (!isValid) {
      errors.push(formatMessage(message, params));
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate entire form
export function validateForm(formData, schema) {
  const errors = {};
  let isValid = true;

  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = formData[fieldName];
    const fieldRules = fieldSchema.rules || [];
    const displayName = fieldSchema.label || fieldName;

    const result = validateField(value, fieldRules, displayName);

    if (!result.isValid) {
      errors[fieldName] = result.errors;
      isValid = false;
    }
  }

  return {
    isValid,
    errors
  };
}

// React hook for form validation
import { useState, useCallback } from 'react';

export function useFormValidation(schema) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback((formData) => {
    const result = validateForm(formData, schema);
    setErrors(result.errors);
    return result.isValid;
  }, [schema]);

  const validateFieldByName = useCallback((fieldName, value) => {
    const fieldSchema = schema[fieldName];
    if (!fieldSchema) return true;

    const result = validateField(value, fieldSchema.rules || [], fieldSchema.label || fieldName);

    setErrors(prev => ({
      ...prev,
      [fieldName]: result.errors
    }));

    return result.isValid;
  }, [schema]);

  const touchField = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const getFieldError = useCallback((fieldName) => {
    if (!touched[fieldName]) return null;
    const fieldErrors = errors[fieldName];
    return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : null;
  }, [errors, touched]);

  const resetErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validate,
    validateField: validateFieldByName,
    touchField,
    getFieldError,
    resetErrors,
    hasErrors: Object.keys(errors).length > 0
  };
}

// Common form schemas
export const schemas = {
  login: {
    email: {
      label: 'Email',
      rules: ['required', 'email']
    },
    password: {
      label: 'Password',
      rules: ['required', { rule: 'minLength', value: 6 }]
    }
  },

  register: {
    name: {
      label: 'Name',
      rules: ['required', { rule: 'minLength', value: 2 }, { rule: 'maxLength', value: 50 }]
    },
    email: {
      label: 'Email',
      rules: ['required', 'email']
    },
    password: {
      label: 'Password',
      rules: ['required', 'password']
    },
    confirmPassword: {
      label: 'Confirm Password',
      rules: ['required']
    }
  },

  event: {
    title: {
      label: 'Event Title',
      rules: ['required', { rule: 'minLength', value: 3 }, { rule: 'maxLength', value: 100 }]
    },
    description: {
      label: 'Description',
      rules: ['required', { rule: 'minLength', value: 10 }]
    },
    start_time: {
      label: 'Start Time',
      rules: ['required', 'date']
    },
    end_time: {
      label: 'End Time',
      rules: ['required', 'date']
    },
    capacity: {
      label: 'Capacity',
      rules: [{ rule: 'min', value: 1 }]
    }
  },

  booking: {
    name: {
      label: 'Name',
      rules: ['required']
    },
    email: {
      label: 'Email',
      rules: ['required', 'email']
    },
    phone: {
      label: 'Phone',
      rules: ['phone']
    },
    participants: {
      label: 'Number of Participants',
      rules: ['required', { rule: 'min', value: 1 }, { rule: 'max', value: 20 }]
    }
  },

  feedback: {
    message: {
      label: 'Message',
      rules: ['required', { rule: 'minLength', value: 10 }, { rule: 'maxLength', value: 1000 }]
    },
    email: {
      label: 'Email',
      rules: ['email']
    }
  }
};

export default {
  rules,
  validateField,
  validateForm,
  useFormValidation,
  schemas
};
