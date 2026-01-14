import PocketBase from 'pocketbase'

// get the env variable for the pocketbase url
const PB_URL = import.meta.env.VITE_PB_URL

// export a single PocketBase instance
export const pb = new PocketBase(PB_URL)
