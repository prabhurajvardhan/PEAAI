/**
 * Integration Layer Index
 * 
 * Exports all integration utilities for module integration.
 */

export {
  ModuleProvider,
  useModule,
  eventBus,
  useModuleInitialization,
  useLazyModuleLoader,
  type IModuleIntegration,
  type ModuleRegistry,
  type M01Integration,
  type M07Integration,
  type EventHandler,
} from './ModuleIntegration.tsx';
