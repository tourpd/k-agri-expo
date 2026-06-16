"use client";

import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridReadyEvent } from "ag-grid-community";
import {
  AllCommunityModule,
  ModuleRegistry,
} from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

type Props<T> = {
  rows: T[];
  columns: ColDef<T>[];
  height?: string | number;
  onRowClick?: (row: T) => void;
};

export default function KAgriExcelGrid<T extends object>({
  rows,
  columns,
  height = "70vh",
  onRowClick,
}: Props<T>) {
  const defaultColDef: ColDef<T> = {
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    minWidth: 90,
  };

  function onGridReady(e: GridReadyEvent<T>) {
    e.api.sizeColumnsToFit();
  }

  return (
    <div className="ag-theme-quartz" style={{ width: "100%", height }}>
      <AgGridReact<T>
        rowData={rows}
        columnDefs={columns}
        defaultColDef={defaultColDef}
        rowSelection="multiple"
        rowHeight={130}
        animateRows
        pagination
        paginationPageSize={50}
        context={{ openDetail: onRowClick }}
        onGridReady={onGridReady}
        onRowClicked={(e) => {
          if (e.data && onRowClick) onRowClick(e.data);
        }}
      />
    </div>
  );
}
