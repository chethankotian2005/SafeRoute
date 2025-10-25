/**
 * Validation Utilities
 * Input validation functions for forms and data
 */

import { REPORT_TYPES, SEVERITY_LEVELS } from './constants';

/**
 * Validate email address
 * @param {string} email
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Indian phone number: 10 digits, optionally starting with +91 or 91
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Invalid phone number. Must be 10 digits starting with 6-9' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate password
 * @param {string} password
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validatePassword = (password) => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate coordinates
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateCoordinates = (latitude, longitude) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { isValid: false, error: 'Coordinates must be numbers' };
  }

  if (latitude < -90 || latitude > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (longitude < -180 || longitude > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate community report data
 * @param {Object} reportData
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateCommunityReport = (reportData) => {
  const errors = {};

  // Check report type
  if (!reportData.reportType) {
    errors.reportType = 'Report type is required';
  } else if (!Object.values(REPORT_TYPES).includes(reportData.reportType)) {
    errors.reportType = 'Invalid report type';
  }

  // Check severity
  if (!reportData.severity) {
    errors.severity = 'Severity level is required';
  } else if (!Object.values(SEVERITY_LEVELS).includes(reportData.severity)) {
    errors.severity = 'Invalid severity level';
  }

  // Check description
  if (!reportData.description || reportData.description.trim() === '') {
    errors.description = 'Description is required';
  } else if (reportData.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (reportData.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  // Check location
  if (!reportData.location) {
    errors.location = 'Location is required';
  } else {
    const coordValidation = validateCoordinates(
      reportData.location.latitude,
      reportData.location.longitude
    );
    if (!coordValidation.isValid) {
      errors.location = coordValidation.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate emergency contact
 * @param {Object} contact
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateEmergencyContact = (contact) => {
  const errors = {};

  // Check name
  if (!contact.name || contact.name.trim() === '') {
    errors.name = 'Name is required';
  } else if (contact.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  // Check phone
  const phoneValidation = validatePhone(contact.phone);
  if (!phoneValidation.isValid) {
    errors.phone = phoneValidation.error;
  }

  // Check relationship (optional but validate if provided)
  if (contact.relationship && contact.relationship.trim() === '') {
    errors.relationship = 'Relationship cannot be empty if provided';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate safety score (1-10)
 * @param {number} score
 * @returns {boolean}
 */
export const validateSafetyScore = (score) => {
  return typeof score === 'number' && score >= 1 && score <= 10;
};

/**
 * Validate route data
 * @param {Object} routeData
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateRouteData = (routeData) => {
  const errors = {};

  // Check origin
  if (!routeData.origin) {
    errors.origin = 'Origin is required';
  } else {
    const originValidation = validateCoordinates(
      routeData.origin.latitude,
      routeData.origin.longitude
    );
    if (!originValidation.isValid) {
      errors.origin = originValidation.error;
    }
  }

  // Check destination
  if (!routeData.destination) {
    errors.destination = 'Destination is required';
  } else {
    const destValidation = validateCoordinates(
      routeData.destination.latitude,
      routeData.destination.longitude
    );
    if (!destValidation.isValid) {
      errors.destination = destValidation.error;
    }
  }

  // Check if coordinates exist
  if (routeData.coordinates && !Array.isArray(routeData.coordinates)) {
    errors.coordinates = 'Coordinates must be an array';
  }

  // Check safety score if provided
  if (routeData.safetyScore !== undefined && !validateSafetyScore(routeData.safetyScore)) {
    errors.safetyScore = 'Safety score must be between 1 and 10';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize user input (remove potentially harmful characters)
 * @param {string} input
 * @returns {string}
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

/**
 * Validate image file
 * @param {Object} file - File object with uri, type, size
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateImageFile = (file) => {
  if (!file || !file.uri) {
    return { isValid: false, error: 'No file selected' };
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (file.type && !validTypes.includes(file.type.toLowerCase())) {
    return { isValid: false, error: 'Invalid file type. Please use JPEG, PNG, or GIF' };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size && file.size > maxSize) {
    return { isValid: false, error: 'File size exceeds 5MB limit' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate URL
 * @param {string} url
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateURL = (url) => {
  if (!url || url.trim() === '') {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    new URL(url);
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

/**
 * Validate date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateDateRange = (startDate, endDate) => {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    return { isValid: false, error: 'Invalid date format' };
  }

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }

  if (startDate > endDate) {
    return { isValid: false, error: 'Start date must be before end date' };
  }

  return { isValid: true, error: null };
};

export default {
  validateEmail,
  validatePhone,
  validatePassword,
  validateCoordinates,
  validateCommunityReport,
  validateEmergencyContact,
  validateSafetyScore,
  validateRouteData,
  sanitizeInput,
  validateImageFile,
  validateURL,
  validateDateRange,
};
