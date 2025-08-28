import { rowvalidator, uniquenessValidator } from "./validationTests.js";

function objectMerge(object1, object2) {
    const mergedObject = {};
    const allKeys = new Set([...Object.keys(object1), ...Object.keys(object2)]);
    allKeys.forEach(key => {
        const arr1 = object1[key];
        const arr2 = object2[key];

        mergedObject[key] = Array.from(new Set([...arr1, ...arr2]));
    });    

    return mergedObject;
}

export function validateFileData(fileData: Record<string,any>[]): Record<string,any>[] {
    let uniquenessViolations: Record<string, string[]> = uniquenessValidator(["Number", "Email"], fileData);
    let rowViolations = fileData.reduce((accumulator, record) => {
        accumulator[record.index] = rowvalidator(record);
        return accumulator;
    }, {} as Record<string, string[]>);

    const allViolations = objectMerge(uniquenessViolations, rowViolations);
    const fileDataCopy = JSON.parse(JSON.stringify(fileData)); // Deep Copy

    Object.keys(allViolations).forEach(indexString => {
        const index = Number(indexString);
        const errorKeys = allViolations[indexString];
        const row = fileDataCopy.find(r => r.index === index); // Use index value from data
        
        row.valid = false;
        row.errors = errorKeys;
    });

    fileDataCopy.forEach(record => {
        if (!(record.index in allViolations)) {
            record.valid = true;
            record.errors = [];
        }
    });

    return fileDataCopy;

}