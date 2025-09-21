import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "../styles/dataGrid.css"

ModuleRegistry.registerModules([ AllCommunityModule ]);


function DataTableComponent({ rows, tableRef, excludedFields, onCellValueChanged, searchQuery, onHasMatch }) {
	
	const displayColumns = rows.length > 0
	? Object.keys(rows[0]).filter(key => !excludedFields.includes(key))
	: [];
	
	const firstColumn = displayColumns[0];
	const noFirstColumn = displayColumns.slice(1);
	
	const agColumns = [
		{	
			headerName: "_valid",
			field: "_valid",
			hide: true,
		},
		
		...(firstColumn ? [{
			headerName: firstColumn,
			field: firstColumn,
			editable: false,
			filter: false,
			flex: 1,
		}] : []),
		
		...noFirstColumn.map(column => ({
			headerName: column,
			field: column,
			editable: true,
			flex:1,
			filter: true,
			cellClass: params =>
				params.data._valid === false
				&& params.data._errorCols.length > 0
				&& params.data._errorCols.includes(params.colDef.field)
				? "cell-error"
				: undefined,
		})),
		
	];
	
	const useAutoHeight = rows.length < 10;
	
	const setRowStyle = params => {
		if (params.data._valid === true) return { backgroundColor: "#77e977ff" };
		if (params.data._valid === false) return { backgroundColor: "#f0b6b6ff" };
		return undefined;
	}
	
	// Retports matches when user enters text
	const handleFilterChanged = event => {
		if (!onHasMatch) return;
		const query = (searchQuery || "").trim();
		if (query.length === 0) return;
		onHasMatch(event.api.getDisplayedRowCount() > 0);
	}

	// Forward API to the SheetTabs component
	const handleGridReady = params => {
        if (typeof tableRef === "function") tableRef(params.api);
        else if (tableRef && typeof tableRef === "object") tableRef.current = params.api;
	};
	

	return (
		<div className="ag-theme-alpine data-grid-base">
			<AgGridReact
				rowData={rows}
				columnDefs={agColumns}
				getRowStyle={setRowStyle}
				onCellValueChanged={onCellValueChanged}
				onFilterChanged={handleFilterChanged}
				onGridReady={handleGridReady}
				getRowId={params => String(params.data._index)}
				domLayout={useAutoHeight ? 'autoHeight' : undefined}
				quickFilterText={searchQuery}
			/>			
		</div>
	);
}

export default DataTableComponent;