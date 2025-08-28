export function rowvalidator(
    row: Record<string, any>,
    excludekeys: string[] = ["index", "valid", "errors"],
    defaultVal: string = "17:00"
): string[] {
    const nullKeys: string[] = [];
    
    // Return all keys with null value except time key which is set to 1700
    Object.keys(row)
        .filter((key) => !excludekeys.includes(key))
        .forEach((key) => {
            if (row[key] === null) {
                if (key.toLowerCase() === "time") row[key] = defaultVal;
                else nullKeys.push(key);
            }
        })
    return nullKeys;
}