import path from "path";
import { convertExcelToJson } from "./../src/fileInjestor.js";

async function main() {
    const fileName = process.argv[2];
    if (!fileName) {
        console.error("Specify filename");
        process.exit(1);
    }

    const excelPath = path.resolve("C:/Repos/customer-validator-frappe/backend/uploads/", fileName);
    const outputDir = path.resolve("C:/Repos/customer-validator-frappe/backend/uploads/");

    try {
        const jsonPath = await convertExcelToJson(excelPath, outputDir);
        console.log("Conversion successful! JSON saved at:", jsonPath);
    } catch (err) {
        console.error("Conversion failed:", err);
    }
}

main();