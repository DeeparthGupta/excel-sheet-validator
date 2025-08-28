const fileStore = new Map<string, Record<string, any>[]>();

export function saveFileToMemory(key: string, data: Record<string, any>[]){
    fileStore.set(key,data)
}

export function retrieveFileFromMemory(key: string):Record<string, any>[] | undefined {
    return fileStore.get(key);
}

export function deleteFileInMemory(key: string) {
    fileStore.delete(key)
}