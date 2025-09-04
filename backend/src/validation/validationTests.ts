import { parse, isValid } from "date-fns";


export function rowvalidator(
    row: Record<string, any>,
    excludekeys: string[] = ["_index", "_valid", "_errors"],
    defaultVal: string = "17:00"
): string[] {
    const errorKeys: Set<string> = new Set();
    
    // Return all keys with null value except time key which is set to 1700
    Object.keys(row)
        .filter((key) => !excludekeys.includes(key))
        .forEach((key) => {
            if (row[key] === null) {
                if (key.toLowerCase() === "time") row[key] = defaultVal;
                else errorKeys.add(key);
            } else {
                if (key.toLowerCase() === "time" && !timeValidator(row[key])) row[key] = defaultVal;
                if (key.toLowerCase() === "number" && !rangeValidator(row[key])) errorKeys.add(key);
            }
            
        })
    return Array.from(errorKeys);
}


function rangeValidator(
    number: number,
    min: number = 1,
    max: number = 11000
): boolean{
    return (number >= min && number <= max);
}

function timeValidator(
    inputString: string
): boolean{
    const parsedString = parse(inputString, "HH:mm", new Date());
    return isValid(parsedString) && inputString === parsedString.toTimeString().slice(0, 5);
}


export function uniquenessValidator(
    keys: string[],
    records: Record<string,any>[]
): Record<string, string[]>{
    const valueMap = new Map<string, Map<any, number[]>>();

    keys.forEach(key => {
        valueMap.set(key, new Map<any,number[]>())
    });

    // Populate value map
    records.forEach(record => {
        const index = record._index;
        keys.forEach(key => {
            const value = record[key];
            if (value !== null) {
                const keyMap = valueMap.get(key)!; // ! defines a value as definitely not null or undefined
                if (!keyMap.has(value)) {
                    keyMap.set(value, []);
                }
                keyMap.get(value)!.push(index);
            }
        });
    });

    const result: Record<string, string[]> = {};
    keys.forEach(key => {
        const keyMap = valueMap.get(key)!;
        keyMap.forEach((indices, value) => {
            if (indices.length > 1) {
                indices.forEach(idx => {
                    if (!result[idx]) result[idx] = [];
                    if (!result[idx].includes(key)) result[idx]!.push(key);
                });
           } 
        });
    });
    return result;
}
