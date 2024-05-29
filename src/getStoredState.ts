/* eslint-disable @typescript-eslint/no-explicit-any */
import type { KeyAccessState, PersistConfig, State, ExactKeys, Deserialize } from './types'

import { KEY_PREFIX } from './constants'

// S is the redux reducers/redux state
// RS is the raw state stored in the storage
export default function getStoredState<S extends { [key: string]: object }, RS extends ExactKeys<S, RS> & ExactKeys<S, RS>>(
  config: PersistConfig<S, RS>
): Promise<State<S> | void> {
  const transforms = config.transforms || []
  const storageKey: keyof KeyAccessState<RS> = `${
    config.keyPrefix !== undefined ? config.keyPrefix : KEY_PREFIX
  }${config.key}`
  const storage = config.storage
  const debug = config.debug
  let deserialize: Deserialize<RS>
  if (config.deserialize) {
    deserialize = config.deserialize
  } else {
    deserialize = defaultDeserialize
  }
  return storage.getItem(storageKey).then((serialized: Parameters<Deserialize<RS>> | undefined) => { // TODO: Change unknown to Parameters of dezerialize
    if (!serialized) return undefined
    else {
      try {
        const rawState = deserialize(serialized);
        let state: State<S> = transforms.reduceRight((subState, transformer) => {
            (Object.keys(rawState) as Array<keyof State<S>>).forEach(key => {
                subState[key] = transformer.out(subState[key], key, rawState)
            })
            return subState
        }, rawState as unknown as State<S>) // Used because the transformers does not returned same type
        return state
      } catch (err) {
        if (process.env.NODE_ENV !== 'production' && debug)
          console.log(
            `redux-persist/getStoredState: Error restoring data ${serialized}`,
            err
          )
        throw err
      }
    }
  })
}

function defaultDeserialize(serial: string) {
  return JSON.parse(serial)
}
