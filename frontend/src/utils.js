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

export const processDataForFrappe = (data, hiddenColumns) => {
    const columns = [
        { name: "Customer Name", id: "Customer Name" },
        { name: "Number", id: "Number" },
        { name: "Email", id: "Email" },
        { name: "Time", id: "Time" },
    ]/* Object.keys(data[0] || {})
        .filter(key => !hiddenColumns.includes(key))
        .map((key) => ({
            name: key,
            id: key,
        }));

    const rows = data .map(row =>
        columns.map(col =>
            String(row[col.id] ?? "")
        )
    );
    
    console.log("Columns:", JSON.stringify(columns,null,2));
    console.log("Rows:", JSON.stringify(rows,null,2));

    setColumns(columns);
    setFilteredRows(data) */
    return { columns: columns, filteredRows: data };
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
    console.log(`Filename: ${filename}`);
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