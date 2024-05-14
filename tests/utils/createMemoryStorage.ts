/* eslint-disable @typescript-eslint/no-explicit-any */
import { PersistState, Storage } from "../../src/types"

interface StateObj {
  [key: string]: unknown;
  _persist: PersistState;
}

export function createMemoryStorage<S>():Storage<S> {
  const state: StateObj = {}
  return {
    getItem(key) {
      return Promise.resolve(state[key])
    },
    setItem(key, value): Promise<unknown> {
      state[key] = value
      return Promise.resolve(value)
    },
    removeItem(key: string): Promise<void> {
      delete state[key]
      return Promise.resolve()
    },
    getAllKeys(): Promise<Array<string>> {
      return Promise.resolve(Object.keys(state))
    },
    keys: Object.keys(state)
  }
}

export default createMemoryStorage
