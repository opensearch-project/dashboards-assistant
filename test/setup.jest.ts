/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configure } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'util';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test-subj' });

// https://github.com/inrupt/solid-client-authn-js/issues/1676#issuecomment-917016646
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

window.URL.createObjectURL = () => '';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
HTMLCanvasElement.prototype.getContext = () => '' as any;
Element.prototype.scrollIntoView = jest.fn();
window.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  disconnect() {
    return null;
  }

  observe() {
    return null;
  }

  takeRecords() {
    return null;
  }

  unobserve() {
    return null;
  }
} as unknown as typeof window.IntersectionObserver;

jest.mock('@elastic/eui/lib/components/form/form_row/make_id', () => () => 'random-id');

jest.mock('@elastic/eui/lib/services/accessibility/html_id_generator', () => ({
  htmlIdGenerator: () => {
    return () => 'random_html_id';
  },
}));

jest.setTimeout(30000);

// jest-location-mock uses process.env.HOST as the base URL for its window.location mock.
// Set it to match testEnvironmentOptions.url so window.location.origin is 'http://localhost:5601'
// in all jsdom tests, consistent with the rest of the suite.
process.env.HOST = 'http://localhost:5601';

// Mock window.matchMedia for Monaco editor
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// jsdom 26 marks window.localStorage and window.sessionStorage as non-configurable.
// Re-declare them as configurable once here so individual tests can override them
// with Object.defineProperty without hitting "Cannot redefine property" errors.
['localStorage', 'sessionStorage'].forEach((key) => {
  const descriptor = Object.getOwnPropertyDescriptor(window, key);
  if (descriptor && !descriptor.configurable) {
    Object.defineProperty(window, key, {
      configurable: true,
      writable: true,
      value: descriptor.value,
    });
  }
});
