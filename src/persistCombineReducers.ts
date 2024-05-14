/* eslint-disable @typescript-eslint/no-explicit-any */
import { Action, combineReducers, Reducer, ReducersMapObject, UnknownAction } from 'redux'
import persistReducer from './persistReducer'
import autoMergeLevel2 from './stateReconciler/autoMergeLevel2'

import type { 
  PersistConfig,
  PersistedState
} from './types'

// combineReducers + persistReducer with stateReconciler defaulted to autoMergeLevel2
// Combines the reducers and returns a persitReducer
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function persistCombineReducers<S>(
  config: PersistConfig<S>,
  reducers: S
): ReturnType<typeof persistReducer> {
  config.stateReconciler =
    config.stateReconciler === undefined
      ? autoMergeLevel2
      : config.stateReconciler
  return persistReducer(config, combineReducers(reducers))
}
