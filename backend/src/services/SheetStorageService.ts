import { Sheet, Workbook } from "../types/types.js";

const workBookStore:Map<string, Workbook> = new Map();

export function saveWorkbookToMemory(name: string, data: Workbook) {
    //console.log(`Saving to memory at key: ${key}, Data Length = ${data.length}`);
    workBookStore.set(name, data)
    //console.log(`Saved to memory at key: ${key} \n Now has ${objectStore.get(key)?.length || 0} records`);
}

export function retrieveWorkbookFromMemory(name: string): Workbook | undefined {
    //console.log(`Retrieving from memory key: ${ key }`)
    const data = workBookStore.get(name);
    //console.log(`Retrieved. Object is of size ${ data?.length || 0 }`)
    return data
}

export function deleteWorkbookInMemory(name: string) {
    workBookStore.delete(name);
}

export function retrieveSheetFromWorkbook(workbookName: string, sheetName: string): Sheet | undefined{
    const workbook = workBookStore.get(workbookName);
    if (workbook) {
        const sheet = workbook.get(sheetName);
        if (sheet) {
            return sheet;
        }
    }
    console.log(`Unable to find ${sheetName} in ${workbookName}`);
    return undefined;
}

export function saveSheetInWorkbook(workbookName: string, sheetName:string, data:Sheet) {
    let workbook = workBookStore.get(workbookName);
    if (!workbook) {
        workBookStore.set(workbookName, new Map<string, Sheet>());
        workbook = workBookStore.get(workbookName)!;
    }
    workbook.set(sheetName, data);
}