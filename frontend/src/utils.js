export const retrieveData = async (filename, targetServer) => {
    try {
        const response = await fetch(`${targetServer}/retrieve?filename=${filename}`);
        const responseData = await response.json();

        if (response.status === 200 && Object.keys(responseData.data).length > 0) {
            //console.log(JSON.stringify(responseData.data, null, 2));
            return { fileName:responseData.filename, data: responseData.data, message: responseData.message || "Data retrieved" };
        } else {
            return { fileName:responseData.filename, data: {}, message: "Failed to retrieve data:" + (responseData.error || "Unknown error")};
        }
    } catch (err) {
        return { data: {}, message: "Unable to retrieve data:" + err };
    }
};

/* const uploadToDB = async (uploadTarget, server, filename) => {
    const endpoint = uploadTarget === "postgres"
        ? `${server}/uploadpostgres`
        : `${server}/uploadmongodb`;
    
    try {
        const response = await fetch(`${endpoint}?filename=${filename}`);
        const responseData = await response.json();
        if (response.ok) {
            setUploadDbResult(`Upload to ${uploadTarget} successful: ${responseData.message || ""}`);
        } else {
            setUploadDbResult(`Upload failed: ${responseData.error}`);
        }
    } catch (err) {
        setUploadDbResult(`Failed to sent do DB: ${err}`);
    }
} */


/* const updateData = (modRow) =>{
    const index = data.findIndex(row => row.Number === modRow.Number);
    if (index !== -1) {
        const dataCopy = [...data];
        dataCopy[index] = modRow;
        return dataCopy;
    }
} */

export const revalidate = async (modRow, filename, targetServer, sheetName, relationConfig = null) => {
    //console.log(`ModRow: ${modRow}`);
    try {
        const response = await fetch(`${targetServer}/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: filename,
                sheetName: sheetName,
                row: modRow,
                relationConfig: relationConfig,
            })
        });
        const result = await response.json();
        if (response.status === 200) {
            return { success: true, message: result.message };
        } else {
            return { success: false, message: `Update failed: ${result.error}` };
        }
    } catch (err) {
        return { success: true, message: `Error sending update: ${err}` };
    }
};

export const dataDiff = (oldData, newData) => {
    const diff = {};
    for (const sheetName of Object.keys(newData)) {
        const oldRows = oldData[sheetName] || [];
        const newRows = newData[sheetName] || [];
        diff[sheetName] = [];
        for (let i = 0; i < newRows.length; i++) {
            const oldRow = oldRows[i];
            const newRow = newRows[i];
            
            if (!oldRow) {
                diff[sheetName].push(newRow);
                continue;
            }
            for (const key in newRow) {
                if (Array.isArray(oldRow[key]) && Array.isArray(newRow[key])) {
                    if (JSON.stringify(oldRow[key]) !== JSON.stringify(newRow[key])) {
                        diff[sheetName].push(newRow);
                        break
                    }
                }
                else if (oldRow[key] !== newRow[key]) {
                    diff[sheetName].push(newRow);
                    break;
                }
            }
        }
    }
    return diff;
};  