export function assignRowClasses(datatable, serverData, columns) {
  const rows = datatable.getRows();

  serverData.forEach((rowObj, i) => {
    const row = rows[i];
    if (!row) return;

    // Clear prior row classes
    row.el.classList.remove("row-error", "row-ok");

    if (rowObj.errors.length > 0) {
      row.el.classList.add("row-error");

      // Add error classes to specific cells
      rowObj.errors.forEach(colName => {
        const colIndex = columns.findIndex(c => c.name === colName);
        if (colIndex !== -1 && row.cells[colIndex]?.el) {
          row.cells[colIndex].el.classList.add("cell-error");
        }
      });
    } else {
      row.el.classList.add("row-ok");
    }
  });
}
