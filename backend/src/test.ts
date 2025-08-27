import path from "path";
import { convertExcelToJson } from "./fileInjestor.js";

async function main() {
    // Replace with the path to your Excel file
    const excelPath = path.resolve("C:/Repos/customer-validator-frappe/backend/uploads/test_sheet.xlsx");
    const outputDir = path.resolve("C:/Repos/customer-validator-frappe/backend/uploads/");

    try {
        const jsonPath = await convertExcelToJson(excelPath, outputDir);
        console.log("Conversion successful! JSON saved at:", jsonPath);
    } catch (err) {
        console.error("Conversion failed:", err);
    }
}

main();