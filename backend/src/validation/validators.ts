import path from "path";
import { rowvalidator, uniquenessValidator } from "./validationTests.js";
import fs from "fs/promises";

function objectMerge(object1, object2) {

    const object1Keys = Object.keys(object1);
    const object2Keys = Object.keys(object2);

    if (object1Keys.length < 1) {
        return object2;
    } else if (object2Keys.length < 1) {
        return object1;
    }

    const mergedObject = {};
    const allKeys = new Set([...object1Keys, ...object2Keys]);
    allKeys.forEach(key => {
        const arr1 = object1[key] || [];
        const arr2 = object2[key] || [];

        mergedObject[key] = Array.from(new Set([...arr1, ...arr2]));
    });    

    return mergedObject;
}

export function validateFileData(fileData: Record<string,any>[]): Record<string,any>[] {
    let uniquenessViolations: Record<string, string[]> = uniquenessValidator(["Number", "Email"], fileData);
    let rowViolations = fileData.reduce((accumulator, record) => {
        const errors = rowvalidator(record);
        
        if (errors.length > 0) {
            accumulator[record._index] = errors;
        }
        
        return accumulator;
    }, {} as Record<string, string[]>);

    const allViolations = objectMerge(uniquenessViolations, rowViolations);
    const fileDataCopy = JSON.parse(JSON.stringify(fileData)); // Deep Copy

    Object.keys(allViolations).forEach(indexString => {
        const index = Number(indexString);
        const errorKeys = allViolations[indexString];
        const row = fileDataCopy.find(r => r._index === index); // Use index value from data
        
        row._valid = false;
        row._errors = errorKeys;
    });

    fileDataCopy.forEach((record: { _index: string; _valid: boolean; _errors: string[]; }) => {
        if (!(record._index in allViolations)) {
            record._valid = true;
            record._errors = [];
        }
    });

    return fileDataCopy;

}