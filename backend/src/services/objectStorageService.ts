type Workbook = {
    sheets: Map<string, Record<string, any>[]>;
    metadata?: Record<string, any>;
}

const objectStore = new Map<string, any>();
const workBookStore = new Map<string, Workbook>();

export function saveObjectToMemory(key: string, data: Record<string, any>[]) {
    objectStore.set(key, data)
}

export function retrieveObjectFromMemory(key: string): Record<string, any>[] | undefined {
    return objectStore.get(key);
}

export function deleteObjectInMemory(key: string) {
    objectStore.delete(key)
}