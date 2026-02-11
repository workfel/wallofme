/**
 * Re-export the AppType from the backend.
 * This file serves as an isolation boundary so the Angular compiler
 * only type-checks this single import rather than the entire backend.
 */
export type { AppType } from '@backend/index';
