import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Modal,
  Card,
} from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { toast } from "react-toastify";
import { postRequest } from "../../serverconfiguration/requestcomp";
import { ServerConfig } from "../../serverconfiguration/serverconfig";
import { REPORTS, SAVE } from "../../serverconfiguration/controllers";
import Navbar from "../Home Page-comapny/Navbar1";
import Sidenav from "../Home Page-comapny/Sidenav1";

const DepartmentMasterBootstrap = () => {
  const [company, setCompany] = useState([]);
  const [branch, setBranch] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [modifiedRows, setModifiedRows] = useState({});
  const [pnCompanyId, setPnCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [viewData, setViewData] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const databaseName = sessionStorage.getItem("databaseName"); // ✅ dynamic DB name

  const getStatusLabel = (char) =>
    char === "A"
      ? "Active"
      : char === "I"
      ? "Inactive"
      : char === "P"
      ? "Pending"
      : "";

  const getStatusChar = (label) =>
    label === "Active"
      ? "A"
      : label === "Inactive"
      ? "I"
      : label === "Pending"
      ? "P"
      : "";

  // Fetch data
  const fetchCompanyData = async () => {
    const isloggedin = sessionStorage.getItem("user");
    const companyData = await postRequest(ServerConfig.url, REPORTS, {
      query: `SELECT * FROM [${databaseName}].[dbo].[paym_Company] WHERE company_user_id = '${isloggedin}'`,

    });
    setCompany(companyData.data);
    if (companyData.data.length > 0) {
      setPnCompanyId(companyData.data[0].pn_CompanyID);
      setCompanyName(companyData.data[0].CompanyName);
    }
  };

  const fetchBranchData = async () => {
    if (!pnCompanyId) return;
    const branchData = await postRequest(ServerConfig.url, REPORTS, {
      query: `SELECT * FROM [${databaseName}].[dbo].[paym_Branch] WHERE pn_CompanyID = '${pnCompanyId}'`,

    });
    setBranch(branchData.data);
  };

  const fetchDepartmentData = async () => {
    if (!pnCompanyId) return;
    const departmentData = await postRequest(ServerConfig.url, REPORTS, {
      query: `SELECT pn_CompanyID, pn_BranchID, pn_DepartmentID, v_DepartmentName, status
        FROM [${databaseName}].[dbo].[paym_Department]
        WHERE pn_CompanyID='${pnCompanyId}'`,

    });
    const formatted = departmentData.data.map((item) => ({
      pnCompanyId: item.pn_CompanyID,
      pn_BranchID: item.pn_BranchID,
      pn_DepartmentID: item.pn_DepartmentID,
      v_DepartmentName: item.v_DepartmentName,
      status: getStatusLabel(item.status),
    }));
    setGridData(formatted || []);
    setOriginalData(JSON.parse(JSON.stringify(formatted)) || []);
    setModifiedRows({});
  };

  const fetchAllData = async () => {
    await fetchCompanyData();
    await fetchBranchData();
    await fetchDepartmentData();
  };

  useEffect(() => {
    fetchAllData();
  }, [pnCompanyId]);

  const isRowModified = useCallback(
    (rowData) => {
      if (rowData.isNew) return false;
      const originalRow = originalData.find(
        (r) => r.pn_DepartmentID === rowData.pn_DepartmentID
      );
      if (!originalRow) return false;
      return (
        String(originalRow.pn_BranchID) !== String(rowData.pn_BranchID) ||
        String(originalRow.v_DepartmentName) !==
          String(rowData.v_DepartmentName) ||
        String(originalRow.status) !== String(rowData.status)
      );
    },
    [originalData]
  );

  const handleCellValueChanged = useCallback(
    (params) => {
      const rowData = params.data;
      if (!rowData.isNew) {
        const modified = isRowModified(rowData);
        setModifiedRows((prev) => ({
          ...prev,
          [rowData.pn_DepartmentID]: modified,
        }));
      }
      params.api.refreshCells({ rowNodes: [params.node], force: true });
    },
    [isRowModified]
  );

  const handleAddRow = () => {
    const lastRow = gridData[gridData.length - 1];
    if (
      lastRow &&
      (!lastRow.pn_BranchID || !lastRow.v_DepartmentName || !lastRow.status)
    ) {
      toast.warning(
        "Please fill all fields in the current row before adding new."
      );
      return;
    }
    setGridData((prev) => [
      ...prev,
      {
        pnCompanyId,
        pn_BranchID: "",
        v_DepartmentName: "",
        status: "",
        isNew: true,
      },
    ]);
  };

  const handleSaveAll = async () => {
    try {
      const newRows = gridData.filter((r) => r.isNew);
      if (!newRows.length) {
        toast.error("No new data to save");
        return;
      }
      for (const row of newRows) {
        if (!row.pn_BranchID || !row.v_DepartmentName || !row.status) {
          toast.error("Please fill all fields for new rows");
          return;
        }
      }
      const queries = newRows.map(
        (row) =>
          `INSERT INTO [${databaseName}].[dbo].[paym_Department]
 (pn_CompanyID, pn_BranchID, v_DepartmentName, status)
 VALUES ('${row.pnCompanyId}', '${row.pn_BranchID}', '${row.v_DepartmentName}', '${getStatusChar(row.status)}')`


      );
      await Promise.all(
        queries.map((q) => postRequest(ServerConfig.url, SAVE, { query: q }))
      );
      toast.success("Saved successfully");
      fetchAllData();
    } catch {
      toast.error("Failed to save data");
    }
  };

  const handleUpdateRow = async (rowData) => {
    try {
      const query = `UPDATE [${databaseName}].[dbo].[paym_Department]
               SET pn_BranchID='${rowData.pn_BranchID}',
                   v_DepartmentName='${rowData.v_DepartmentName}',
                   status='${getStatusChar(rowData.status)}'
               WHERE pn_DepartmentID='${rowData.pn_DepartmentID}'`;

      await postRequest(ServerConfig.url, SAVE, { query });
      const copy = { ...modifiedRows };
      delete copy[rowData.pn_DepartmentID];
      setModifiedRows(copy);
      toast.success("Updated successfully");
      fetchAllData();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDeleteRow = async (rowData) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const query = `DELETE FROM [${databaseName}].[dbo].[paym_Department]
               WHERE pn_DepartmentID='${rowData.pn_DepartmentID}'`;

      await postRequest(ServerConfig.url, SAVE, { query });
      toast.info("Deleted successfully");
      fetchAllData();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleViewRow = (rowData) => {
    setViewData(rowData);
    setShowViewModal(true);
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Branch",
        field: "pn_BranchID",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: branch.map((b) => b.BranchName) },
        valueGetter: (params) =>
          branch.find((b) => b.pn_BranchID === params.data.pn_BranchID)
            ?.BranchName || "",
        valueSetter: (params) => {
          const selected = branch.find((b) => b.BranchName === params.newValue);
          if (selected) {
            params.data.pn_BranchID = selected.pn_BranchID;
            return true;
          }
          return false;
        },
        minWidth: 150,
      },
      {
        headerName: "Department",
        field: "v_DepartmentName",
        editable: true,
        minWidth: 200,
      },
      {
        headerName: "Status",
        field: "status",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["Active", "Inactive", "Pending"] },
        minWidth: 100,
        cellStyle: (params) => ({
          color:
            params.value === "Active"
              ? "#155724"
              : params.value === "Inactive"
              ? "#721c24"
              : "#856404",
          fontWeight: "bold",
        }),
      },
      {
        headerName: "Actions",
        minWidth: 220,
        cellStyle: { display: "flex", justifyContent: "center", gap: "6px" },
        cellRenderer: (params) => (
          <div className="d-flex justify-content-center gap-1">
            <Button
              size="sm"
              variant="info"
              onClick={() => handleViewRow(params.data)}
            >
              View
            </Button>
            <Button
              size="sm"
              variant="success"
              disabled={!modifiedRows[params.data.pn_DepartmentID]}
              onClick={() => handleUpdateRow(params.data)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDeleteRow(params.data)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [branch, modifiedRows]
  );

  const filteredData = useMemo(
    () =>
      gridData.filter(
        (row) =>
          (!statusFilter || row.status === statusFilter) &&
          (!branchFilter || String(row.pn_BranchID) === String(branchFilter))
      ),
    [gridData, statusFilter, branchFilter]
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="d-flex">
        <div style={{ width: "250px" }}>
          <Sidenav />
        </div>
        <div style={{ flex: 1, padding: "20px", marginTop: "80px" }}>
          <Container fluid>
            {/* Header Card */}
            <AppBar
              position="static"
              sx={{
                background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                mb: 3,
                borderRadius: 2,
              }}
            >
              <Toolbar>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  Department Master
                </Typography>
              </Toolbar>
            </AppBar>

            {/* Filters Card */}
            <Card
              className="p-3 mb-3 shadow"
              style={{
                borderRadius: "12px",
                background: "linear-gradient(90deg, #6a11cb, #2575fc)",
              }}
            >
              <Row className="align-items-center">
                <Col xs={12} sm={6} md={4} className="mb-2">
                  <Form.Select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    style={{ backgroundColor: "#ffffff", color: "#000" }}
                  >
                    <option value="">All Branches</option>
                    {branch.map((b) => (
                      <option key={b.pn_BranchID} value={b.pn_BranchID}>
                        {b.BranchName}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={12} sm={6} md={4} className="mb-2">
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ backgroundColor: "#ffffff", color: "#000" }}
                  >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </Form.Select>
                </Col>
                <Col xs={12} md={4} className="text-md-end">
                  <Button
                    onClick={handleAddRow}
                    className="me-2"
                    style={{ backgroundColor: "#ff4b1f", border: "none" }}
                  >
                    Add Department
                  </Button>
                  <Button
                    onClick={handleSaveAll}
                    style={{
                      backgroundColor: "#1fddff",
                      border: "none",
                      color: "#000",
                    }}
                  >
                    Save All
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Grid */}
            <div
              className="ag-theme-alpine"
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <AgGridReact
                rowData={filteredData}
                columnDefs={columnDefs}
                domLayout="autoHeight"
                defaultColDef={{ flex: 1, minWidth: 120, resizable: true }}
                pagination={true}
                paginationPageSize={10}
                animateRows={true}
                onCellValueChanged={handleCellValueChanged}
                getRowStyle={(params) => ({
                  backgroundColor:
                    params.node.rowIndex % 2 === 0 ? "#ffe6e6" : "#fff0f5",
                })}
              />
            </div>
          </Container>
        </div>
      </div>

      <Modal show={showViewModal} onHide={() => setShowViewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Department Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewData && (
            <div>
              <p>
                <strong>Branch:</strong>{" "}
                {
                  branch.find((b) => b.pn_BranchID === viewData.pn_BranchID)
                    ?.BranchName
                }
              </p>
              <p>
                <strong>Department Name:</strong> {viewData.v_DepartmentName}
              </p>
              <p>
                <strong>Status:</strong> {viewData.status}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DepartmentMasterBootstrap;
