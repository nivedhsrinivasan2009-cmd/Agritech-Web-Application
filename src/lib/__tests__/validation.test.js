// Validation Library Tests
import { rules, validateField, validateForm, schemas } from '../validation';

describe('Validation Rules', () => {
  describe('required', () => {
    it('returns true for non-empty values', () => {
      expect(rules.required('test')).toBe(true);
      expect(rules.required(['item'])).toBe(true);
      expect(rules.required(0)).toBe(true);
    });

    it('returns false for empty values', () => {
      expect(rules.required('')).toBe(false);
      expect(rules.required('   ')).toBe(false);
      expect(rules.required(null)).toBe(false);
      expect(rules.required(undefined)).toBe(false);
      expect(rules.required([])).toBe(false);
    });
  });

  describe('email', () => {
    it('validates correct emails', () => {
      expect(rules.email('test@example.com')).toBe(true);
      expect(rules.email('user.name@domain.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(rules.email('invalid')).toBe(false);
      expect(rules.email('test@')).toBe(false);
      expect(rules.email('@example.com')).toBe(false);
    });

    it('allows empty values (use required for that)', () => {
      expect(rules.email('')).toBe(true);
    });
  });

  describe('phone', () => {
    it('validates correct phone numbers', () => {
      expect(rules.phone('+1234567890')).toBe(true);
      expect(rules.phone('123-456-7890')).toBe(true);
      expect(rules.phone('(123) 456-7890')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(rules.phone('123')).toBe(false);
      expect(rules.phone('abc')).toBe(false);
    });
  });

  describe('minLength', () => {
    it('validates strings with minimum length', () => {
      expect(rules.minLength(5)('hello')).toBe(true);
      expect(rules.minLength(5)('hi')).toBe(false);
    });
  });

  describe('maxLength', () => {
    it('validates strings with maximum length', () => {
      expect(rules.maxLength(5)('hello')).toBe(true);
      expect(rules.maxLength(5)('hello world')).toBe(false);
    });
  });

  describe('min', () => {
    it('validates numbers with minimum value', () => {
      expect(rules.min(5)(10)).toBe(true);
      expect(rules.min(5)(5)).toBe(true);
      expect(rules.min(5)(3)).toBe(false);
    });
  });

  describe('max', () => {
    it('validates numbers with maximum value', () => {
      expect(rules.max(10)(5)).toBe(true);
      expect(rules.max(10)(10)).toBe(true);
      expect(rules.max(10)(15)).toBe(false);
    });
  });

  describe('password', () => {
    it('validates strong passwords', () => {
      expect(rules.password('Password1')).toBe(true);
      expect(rules.password('Abcd1234')).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(rules.password('password')).toBe(false); // no uppercase, no number
      expect(rules.password('PASSWORD1')).toBe(false); // no lowercase
      expect(rules.password('Password')).toBe(false); // no number
      expect(rules.password('Pass1')).toBe(false); // too short
    });
  });

  describe('date', () => {
    it('validates correct dates', () => {
      expect(rules.date('2024-01-15')).toBe(true);
      expect(rules.date(new Date().toISOString())).toBe(true);
    });

    it('rejects invalid dates', () => {
      expect(rules.date('not-a-date')).toBe(false);
    });
  });
});

describe('validateField', () => {
  it('returns valid for passing rules', () => {
    const result = validateField('test@example.com', ['required', 'email'], 'Email');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for failing rules', () => {
    const result = validateField('', ['required'], 'Email');
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('handles object rules with custom messages', () => {
    const result = validateField('hi', [
      { rule: 'minLength', value: 5, message: 'Must be at least 5 chars' }
    ], 'Name');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toBe('Must be at least 5 chars');
  });
});

describe('validateForm', () => {
  it('validates entire form against schema', () => {
    const formData = {
      email: 'test@example.com',
      password: 'Password123'
    };

    const result = validateForm(formData, schemas.login);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns all field errors', () => {
    const formData = {
      email: 'invalid',
      password: 'short'
    };

    const result = validateForm(formData, schemas.login);

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
    expect(result.errors.password).toBeDefined();
  });
});

describe('Schemas', () => {
  it('has login schema', () => {
    expect(schemas.login).toBeDefined();
    expect(schemas.login.email).toBeDefined();
    expect(schemas.login.password).toBeDefined();
  });

  it('has register schema', () => {
    expect(schemas.register).toBeDefined();
    expect(schemas.register.name).toBeDefined();
    expect(schemas.register.email).toBeDefined();
    expect(schemas.register.password).toBeDefined();
  });

  it('has event schema', () => {
    expect(schemas.event).toBeDefined();
    expect(schemas.event.title).toBeDefined();
    expect(schemas.event.description).toBeDefined();
  });
});
