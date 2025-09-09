export const retrieveData = async (filename, targetServer) => {
    try {
        const response = await fetch(`${targetServer}/retrieve?filename=${filename}`);
        const responseData = await response.json();

        if (response.ok && responseData.data.length > 0) {
            //console.log(JSON.stringify(responseData.data, null, 2));
            return { data: responseData.data, message: "Data retrieved" };
        } else {
            return { data: [], message: "Failed to retrieve data:" + response.error };
        }
    } catch (err) {
        return { data: [], message: "Unable to retrieve data:" + err };
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

export const revalidate = async (modRow, filename, targetServer) => {
    //console.log(`ModRow: ${modRow}`);
    try {
        const response = await fetch(`${targetServer}/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: filename,
                row: modRow
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
    const diff = []
    for (let i = 0; i < oldData.length; i++) {
        const oldRow = oldData[i];
        const newRow = newData[i];
        for (const key in newRow) {
            if (Array.isArray(oldRow[key]) && Array.isArray(newRow[key])) {
                if (JSON.stringify(oldRow[key]) !== JSON.stringify(newRow[key])) {
                    //console.log(`Row ${i} key "${key}" changed (array):`, oldRow[key], '=>', newRow[key]);
                    diff.push(newRow);
                    break;
                }
            } else if (oldRow[key] !== newRow[key]) {
                //console.log(`Row ${i} key "${key}" changed (array):`, oldRow[key], '=>', newRow[key]);
                diff.push(newRow);
                break;
            } 
        }
    }
    return diff;
};  