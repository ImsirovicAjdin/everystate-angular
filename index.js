/**
 * @everystate/angular
 *
 * Angular adapter for EveryState. Bridges the reactive store to Angular's
 * signal-based reactivity system. ~30 lines, zero dependencies beyond
 * Angular and @everystate/core.
 *
 * Copyright (c) 2026 Ajdin Imsirovic. MIT License.
 */

import { signal } from '@angular/core';

/**
 * usePath: subscribe to a dot-path in the store.
 * Returns a read-only Angular signal that updates when the store value changes.
 * Only components reading this signal re-render - no Zone.js overhead.
 *
 * @param {object} store - An EveryState store instance
 * @param {string} path - Dot-separated state path (e.g. 'state.tasks')
 * @returns {Signal<T>} A read-only Angular signal with the current value
 */
export function usePath(store, path) {
  const sig = signal(store.get(path));
  store.subscribe(path, (val) => sig.set(val));
  return sig.asReadonly();
}

/**
 * useIntent: returns a stable function that publishes a value to a path.
 * Components call this to express intent without knowing who's listening.
 *
 * @param {object} store - An EveryState store instance
 * @param {string} path - Dot-separated intent path (e.g. 'intent.addTask')
 * @returns {(value: any) => any} A setter function
 */
export function useIntent(store, path) {
  return (value) => store.set(path, value);
}

/**
 * useWildcard: subscribe to a wildcard path (e.g. 'state.tasks.*').
 * Returns a read-only signal that updates when any child of that path changes.
 *
 * @param {object} store - An EveryState store instance
 * @param {string} wildcardPath - e.g. 'state.tasks.*' or 'state.*'
 * @returns {Signal<T>} A read-only Angular signal with the parent object
 */
export function useWildcard(store, wildcardPath) {
  const parentPath = wildcardPath.endsWith('.*')
    ? wildcardPath.slice(0, -2)
    : wildcardPath;

  const sig = signal(store.get(parentPath));
  store.subscribe(wildcardPath, () => sig.set(store.get(parentPath)));
  return sig.asReadonly();
}

/**
 * useAsync: subscribe to an async operation's lifecycle at a path.
 * Returns signals for data, status, error, plus execute and cancel functions.
 *
 * @param {object} store - An EveryState store instance
 * @param {string} path - Base path for the async operation
 * @returns {{ data: Signal, status: Signal, error: Signal, execute: Function, cancel: Function }}
 */
export function useAsync(store, path) {
  const data = usePath(store, `${path}.data`);
  const status = usePath(store, `${path}.status`);
  const error = usePath(store, `${path}.error`);

  const execute = (fetcher) => store.setAsync(path, fetcher);
  const cancel = () => store.cancel(path);

  return { data, status, error, execute, cancel };
}
