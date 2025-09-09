import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridReact } from "ag-grid-react";
import { useEffect } from 'react';
import "ag-grid-community/styles/ag-theme-alpine.css";
import "../styles/dataGrid.css"

ModuleRegistry.registerModules([ AllCommunityModule ]);

function DataTableComponent({ rows, tableRef, excludedFields, onCellValueChanged, filterMode }) {

	const isExternalFilterPresent = () => filterMode !== "all";
	const doesExternalFilterPass = (node) => {
		if (filterMode === "valid") return node.data._valid === true;
    	if (filterMode === "invalid") return node.data._valid === false;
    	return true;
	}

	const displayColumns = rows.length > 0
		? Object.keys(rows[0]).filter(key => !excludedFields.includes(key))
		: [];
	

	const agColumns = [
		{
			headerName: "ID",
			field: "id",
			valueGetter: params => (params.data._index + 1),
			editable: false,
			sortable: true,
			filter: false,
			maxWidth: 120,
		},

		{	
			headerName: "_valid",
			field: "_valid",
			hide: true,
			filter: "agSetColumnFilter",
		},

		...displayColumns.map(column => ({
				headerName: column,
				field: column,
				editable: true,
				flex:1,
				cellClass: params =>
					params.data._valid === false
					&& params.data._errors.length > 0
					&& params.data._errors.includes(params.colDef.field)
						? "cell-error"
						: undefined,

			})),

	];

	const useAutoHeight = rows.length < 10;

	const setRowStyle = params => {
		if (params.data._valid === true) return { backgroundColor: "#77e977ff" };
		if (params.data._valid === false) return { backgroundColor: "#f0b6b6ff" };
		return "";
	}

	useEffect(() => {
		if (tableRef.current && tableRef.current.api) {
			tableRef.current.api.onFilterChanged();
		}
	}, [filterMode, tableRef]);

	return (
		<div className="ag-theme-alpine data-grid-base">
			<AgGridReact
				ref={tableRef}
				rowData={rows}
				columnDefs={agColumns}
				getRowStyle={setRowStyle}
				onCellValueChanged={onCellValueChanged}
				getRowId={params => String(params.data._index)}
				isExternalFilterPresent={isExternalFilterPresent}
				doesExternalFilterPass={doesExternalFilterPass}
				domLayout={useAutoHeight ? 'autoHeight' : undefined}
			/>			
		</div>
	);
}

export default DataTableComponent;