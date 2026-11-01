/** Shared SWR fetcher for the admin pages' GET routes — none of them need
 * anything beyond "GET this URL and parse the JSON body", matching what
 * these routes already did with a bare fetch(). */
export const jsonFetcher = (url: string) => fetch(url).then((res) => res.json());
