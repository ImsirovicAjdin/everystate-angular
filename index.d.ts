/**
 * @everystate/angular
 *
 * Angular adapter for EveryState. Bridges the reactive store to Angular's
 * signal-based reactivity system.
 */

import { Signal } from '@angular/core';
import { EveryStateStore } from '@everystate/core';

/**
 * Subscribe to a dot-path in the store.
 * Returns a read-only Angular signal that updates when the store value changes.
 * Only components reading this signal re-render - no Zone.js overhead.
 *
 * @param store - An EveryState store instance
 * @param path - Dot-separated state path (e.g. 'state.tasks')
 * @returns A read-only Angular signal with the current value
 */
export function usePath<T = any>(store: EveryStateStore, path: string): Signal<T>;

/**
 * Returns a stable function that publishes a value to a path.
 * Components call this to express intent without knowing who's listening.
 *
 * @param store - An EveryState store instance
 * @param path - Dot-separated intent path (e.g. 'intent.addTask')
 * @returns A setter function
 */
export function useIntent(store: EveryStateStore, path: string): (value: any) => any;

/**
 * Subscribe to a wildcard path (e.g. 'state.tasks.*').
 * Returns a read-only signal that updates when any child of that path changes.
 *
 * @param store - An EveryState store instance
 * @param wildcardPath - e.g. 'state.tasks.*' or 'state.*'
 * @returns A read-only Angular signal with the parent object
 */
export function useWildcard<T = any>(store: EveryStateStore, wildcardPath: string): Signal<T>;

/**
 * Subscribe to an async operation's lifecycle at a path.
 * Returns signals for data, status, error, plus execute and cancel functions.
 *
 * @param store - An EveryState store instance
 * @param path - Base path for the async operation
 */
export function useAsync<T = any>(store: EveryStateStore, path: string): {
  data: Signal<T>;
  status: Signal<string>;
  error: Signal<any>;
  execute: (fetcher: (signal: AbortSignal) => Promise<T>) => Promise<T>;
  cancel: () => void;
};
