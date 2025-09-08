const objectStore = new Map<string, Record<string, any>[]>();

export function saveObjectToMemory(key: string, data: Record<string, any>[]) {
    //console.log(`Saving to memory at key: ${key}, Data Length = ${data.length}`);
    objectStore.set(key, data)
    //console.log(`Saved to memory at key: ${key} \n Now has ${objectStore.get(key)?.length || 0} records`);
}

export function retrieveObjectFromMemory(key: string): Record<string, any>[] | undefined {
    //console.log(`Retrieving from memory key: ${key}`)
    const data = objectStore.get(key);
    //console.log(`Retrieved. Object is of size ${data?.length || 0}`)
    return data
}

export function deleteObjectInMemory(key: string) {
    objectStore.delete(key)
}