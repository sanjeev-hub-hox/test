"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Tooltip, IconButton, Grid,
  Dialog, DialogTitle, DialogContent, Button,
  Menu,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useGlobalContext } from "src/@core/global/GlobalContext";
import SearchBox from "src/OwnComponents/SharedUIComponent/SearchBox";
import useDebounce from "src/utils/useDebounce";
import { postRequest } from "src/services/apiService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress,
  Select, MenuItem
} from "@mui/material";
import MuiPagination from "@mui/material/Pagination";
import { Can } from "src/components/Can";

const downloadFiles = [
  { id: 1, name: "Leaving Certificate (LC)", fieldKey: "lc" },
  { id: 2, name: "Bonafide Certificate", fieldKey: "bonofied" },
  { id: 3, name: "Marksheets", fieldKey: "marksheet" },
  { id: 4, name: "Receipts", fieldKey: "recipt" },
  { id: 5, name: "Student Documents", fieldKey: "documents" },
];

function EdulearnDocuments() {
  const { setPagePaths } = useGlobalContext();

  const [searchText, setSearchText] = useState("");
  const debouncedSearchTerm = useDebounce(searchText, 500);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [studentData, setStudentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPaths, setMenuPaths] = useState<string[]>([]);
  const [docLoader, setDocLoader] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    setPagePaths([{ title: "Edulearn Documents", path: "/edulearn/edulean-documents" }]);
  }, []);

  // Re-fetch when search or pagination changes
  useEffect(() => {
    studentListing();
  }, [debouncedSearchTerm, paginationModel.page, paginationModel.pageSize]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    // Reset to first page on new search
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleClearSearch = () => {
    setSearchText("");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleDownloadClick = (row: any) => {
    setSelectedRow(row);
    setDownloadDialogOpen(true);
  };

  async function studentListing() {
    setLoading(true);
    try {
      // Fix 1: parse the JSON string from localStorage
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");

      const payload: Record<string, any> = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
      };

      if (debouncedSearchTerm) {
        payload.search = debouncedSearchTerm;
      }
      // console.log('-----', userInfo?.userInfo?.schoolIds?.length);
      if (userInfo?.userInfo?.schoolIds?.length > 0) {
        payload.schoolIds = userInfo?.userInfo?.schoolIds;
      }

      const response: any = await postRequest({
        url: `/studentProfile/oldStudentData`,
        serviceURL: "admin",
        data: payload,
      });

      const stdRecord = response?.data?.data ?? [];
      setTotalCount(response?.data?.total ?? 0);
      const finalData = stdRecord.map((element: any, i: number) => ({
        id: element.id ?? i,       // prefer real DB id
        schoolCode: element.school_code,
        schoolName: element.schoolname,
        fathersName: element.fathers_name,
        mothersName: element.mothers_name,
        studentName: element.student_name,
        dateOfBirth: element.date_of_birth,
        enquiryNo: element.inq_no,
        applicationNo: element.appl_no,
        enrollmentNo: element.enr_no,
        board: element.board,
        grade: element.grade,
        division: element.division,
        lc: element.lc,
        bonofied: element.bonofied,
        recipt: element.recipt,
        marksheet: element.marksheet,
        documents: element.documents,
        meta_doc: (() => {
          const raw = element.meta_doc;
          if (!raw) return [];
          if (Array.isArray(raw)) return raw;
          try { return JSON.parse(raw); } catch { return []; }
        })(),
        meta_excel: (() => {
          const raw = element.meta_excel;
          if (!raw) return [];
          if (Array.isArray(raw)) return raw;
          try { return JSON.parse(raw); } catch { return []; }
        })(),
      }));

      setStudentData(finalData);
    } catch (error) {
      // console.error("Failed to fetch student list:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const formData = new FormData();
    // append each file under the same field name 'files' (matches FilesInterceptor)
    Array.from(selectedFiles).forEach((file) => {
      formData.append("files", file);
    });

    try {
      setUploading(true);
      await postRequest({
        url: `/studentProfile/upload-edulearn-marksheet`,
        serviceURL: "admin",
        data: formData,
      });

      alert("Marksheets uploaded successfully");
      studentListing();
    } catch (error) {
      // console.error("Upload failed", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
      // reset input so same files can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadMetaExcelPDF = (row: any) => {
    if (!row?.meta_excel?.length) return;

    setDocLoader(true); // React renders spinner

    // setTimeout pushes PDF work to next event loop tick
    // giving React time to actually paint the spinner first
    setTimeout(() => {
      try {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.setTextColor(90, 75, 218);
        doc.text("Meta Excel Records", 14, 18);

        let currentY = 28;

        row.meta_excel.forEach((record: Record<string, any>, index: number) => {
          const entries = Object.entries(record).filter(
            ([, value]) => value !== "" && value !== null && value !== undefined
          );

          if (entries.length === 0) return;

          doc.setFontSize(10);
          doc.setTextColor(90, 75, 218);
          doc.text(`Record ${index + 1}`, 14, currentY);
          currentY += 4;

          autoTable(doc, {
            startY: currentY,
            head: [["Field", "Value"]],
            body: entries.map(([key, value]) => [key, String(value)]),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [90, 75, 218], textColor: 255, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [245, 245, 255] },
            columnStyles: {
              0: { fontStyle: "bold", cellWidth: 60, textColor: [80, 80, 80] },
              1: { cellWidth: "auto", textColor: [40, 40, 40] },
            },
            margin: { left: 14, right: 14 },
            theme: "grid",
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;

          if (currentY > 270 && index < row.meta_excel.length - 1) {
            doc.addPage();
            currentY = 14;
          }
        });

        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
          doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, doc.internal.pageSize.height - 10);
        }

        doc.save(`meta-excel-records.pdf`);
      } finally {
        setDocLoader(false); // hide spinner after save
      }
    }, 100);
    // 100ms is enough for React to paint the spinner
  };

  const handleDownloadFile = async (filePath: string) => {
    if (!filePath) return;

    if (filePath.includes('old-student-data')) {
      filePath = filePath.replace('old-student-data/', '');
    }

    const payload = {
      recordId: "dsfg",
      filePath: [filePath],
    };

    const response: any = await postRequest({
      url: `/studentProfile/getDocUrl`,
      serviceURL: "admin",
      data: payload,
    });

    const urls: string[] = response?.data ?? [];
    if (urls.length > 0) {
      window.open(urls[0], "_blank");
    }
  };

  // const handleDownloadMetaExcelPDF = async (row: any) => {
  //   if (!row?.meta_excel) return;
  //   console.log("PDF download triggered for meta_excel:", row.meta_excel);

  // };

  const columns: any[] = useMemo(() => [
    { field: "schoolCode", headerName: "School Code", minWidth: 120, flex: 1 },
    { field: "schoolName", headerName: "School Name", minWidth: 150, flex: 1.2 },
    { field: "fathersName", headerName: "Father's Name", minWidth: 150, flex: 1.2 },
    { field: "mothersName", headerName: "Mother's Name", minWidth: 150, flex: 1.2 },
    { field: "studentName", headerName: "Student Name", minWidth: 150, flex: 1.2 },
    { field: "dateOfBirth", headerName: "Date of Birth", minWidth: 120, flex: 1 },
    { field: "enquiryNo", headerName: "Enquiry No.", minWidth: 150, flex: 1.2 },
    { field: "applicationNo", headerName: "Application No.", minWidth: 150, flex: 1.2 },
    { field: "enrollmentNo", headerName: "Enrollment No.", minWidth: 150, flex: 1.2 },
    { field: "board", headerName: "Board", minWidth: 100, flex: 0.8 },
    { field: "grade", headerName: "Grade", minWidth: 100, flex: 0.8 },
    { field: "division", headerName: "Division", minWidth: 90, flex: 0.7 },
    { field: "actions", headerName: "Action", minWidth: 80, flex: 0.6, align: "center" },
  ], []);

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "nowrap" }}>
        <Box sx={{ background: "#fff", borderRadius: "10px", width: "100%", height: "100%" }}>
          <Grid container>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "16px" }}>
                <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                  <Can pagePermission={'upload_edulearn_documents'} action={'HIDE'}>
                    <>
                      <Button
                        variant="contained"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}   // ← disable while uploading
                        sx={{ mr: 2 }}
                        startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : null}
                      >
                        {uploading ? "Uploading..." : "Upload Marksheet"}
                      </Button>
                      <input
                        type="file"
                        accept="application/pdf"   // ← only PDFs
                        multiple                    // ← multiple files allowed
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileUpload}
                      />
                    </>
                  </Can>
                  <Box sx={{ mr: 2, width: "100%", minWidth: "500px" }}>
                    <SearchBox
                      placeHolderTitle="Search by Student Name, School Code, Enrollment No..."
                      searchText={searchText}
                      handleClearSearch={handleClearSearch}
                      handleInputChange={handleInputChange}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sx={{ mt: 3 }}>
              <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', boxShadow: 'none', height: 'calc(100vh - 370px)', overflowX: 'auto', borderRadius: '8px' }}>
                <Table stickyHeader sx={{ minWidth: 1200 }}>
                  <TableHead>
                    <TableRow>
                      {columns.map((col: any) => {
                        const isLast = col.field === 'actions';
                        return (
                          <TableCell
                            key={col.field}
                            align={col.align || "left"}
                            sx={{
                              backgroundColor: '#f5f5f5',
                              fontWeight: 600,
                              fontSize: '1.1rem',
                              whiteSpace: 'nowrap',
                              minWidth: col.minWidth,
                              borderBottom: 'none',
                              ...(isLast && {
                                position: 'sticky',
                                right: 0,
                                zIndex: 10,
                                boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)',
                              }),
                            }}
                          >
                            {col.headerName}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : studentData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} align="center" sx={{ py: 3, fontSize: '1.1rem' }}>
                          No results found
                        </TableCell>
                      </TableRow>
                    ) : (
                      studentData.map((row, index) => (
                        <TableRow key={row.id || index} hover>
                          {columns.map((col: any) => {
                            const isLast = col.field === 'actions';
                            return (
                              <TableCell
                                key={col.field}
                                align={col.align || "left"}
                                sx={{
                                  whiteSpace: 'nowrap',
                                  fontSize: '1rem',
                                  color: 'rgba(58, 53, 65, 0.87)',
                                  borderBottom: 'none',
                                  ...(isLast && {
                                    position: 'sticky',
                                    right: 0,
                                    zIndex: 5,
                                    backgroundColor: '#fff',
                                    boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)',
                                    '.MuiTableRow-hover:hover &': { backgroundColor: '#f8f8f8' },
                                  }),
                                }}
                              >
                                {col.field === 'actions' ? (
                                  <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
                                    <Tooltip title="Download Files">
                                      <IconButton size="small" color="secondary" onClick={() => handleDownloadClick(row)}>
                                        <span className="icon-document-download" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                ) : (
                                  row[col.field] || "-"
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 2, gap: 2, borderTop: '1px solid #e0e0e0', mt: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(58, 53, 65, 0.87)' }}>
                  Rows per page:
                </Typography>
                <Select
                  size="small"
                  value={paginationModel.pageSize}
                  onChange={(e) => setPaginationModel({ page: 0, pageSize: Number(e.target.value) })}
                  sx={{ height: 32, fontSize: '0.875rem' }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
                <MuiPagination
                  color="primary"
                  count={Math.max(1, Math.ceil(totalCount / paginationModel.pageSize))}
                  page={paginationModel.page + 1}
                  onChange={(e, newPage) => setPaginationModel((prev) => ({ ...prev, page: newPage - 1 }))}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Dialog
        open={downloadDialogOpen}
        onClose={() => setDownloadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 2, position: "relative" } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.25rem" }}>
            Download Files
          </Typography>
          <IconButton onClick={() => setDownloadDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {downloadFiles.map((file) => {
            const raw = selectedRow?.[file.fieldKey];

            // Normalize to array of non-empty paths
            const paths: string[] = raw
              ? (Array.isArray(raw) ? raw : raw.split(",")).map((p: string) => p.trim()).filter(Boolean)
              : [];

            const hasFiles = paths.length > 0;

            return (
              <Box
                key={file.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  px: 3, py: 2, mb: 2,
                  opacity: hasFiles ? 1 : 0.4,
                  "&:last-child": { mb: 0 },
                }}
              >
                <Typography sx={{ fontSize: "0.9375rem", color: "rgba(58, 53, 65, 0.87)" }}>
                  {file.name}
                </Typography>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {hasFiles ? (
                    paths.length === 1 ? (
                      <Tooltip title="Download">
                        <IconButton size="small" sx={{ color: "#5A4BDA" }} onClick={() => handleDownloadFile(paths[0])}>
                          <span className="icon-document-download" style={{ fontSize: "20px" }} />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <>
                        <Tooltip title={`${paths.length} files available`}>
                          <IconButton
                            size="small"
                            sx={{
                              color: "#5A4BDA",
                              border: "1px solid #5A4BDA",
                              borderRadius: "8px",
                              px: 1.5,
                              gap: 0.5,
                            }}
                            onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuPaths(paths); }}
                          >
                            <span className="icon-document-download" style={{ fontSize: "18px" }} />
                            <Typography sx={{ fontSize: "0.75rem", color: "#5A4BDA", fontWeight: 700 }}>
                              {paths.length}
                            </Typography>
                          </IconButton>
                        </Tooltip>

                        <Menu
                          anchorEl={menuAnchor}
                          open={Boolean(menuAnchor)}
                          onClose={() => setMenuAnchor(null)}
                          PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" } }}
                        >
                          {menuPaths.map((path, index) => (
                            <MenuItem
                              key={index}
                              onClick={() => { handleDownloadFile(path); setMenuAnchor(null); }}
                              sx={{ gap: 1.5, fontSize: "0.875rem" }}
                            >
                              <span className="icon-document-download" style={{ fontSize: "16px", color: "#5A4BDA" }} />
                              File {index + 1}
                            </MenuItem>
                          ))}
                        </Menu>
                      </>
                    )
                  ) : (
                    <Tooltip title="No files available">
                      <span>
                        <IconButton size="small" sx={{ color: "#5A4BDA" }} disabled>
                          <span className="icon-document-download" style={{ fontSize: "20px" }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            );
          })}
          {selectedRow?.meta_excel && selectedRow.meta_excel.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography sx={{ fontWeight: 500, fontSize: "1.1rem", color: "rgba(58, 53, 65, 0.87)" }}>
                  Meta Excel Records
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => handleDownloadMetaExcelPDF(selectedRow)}
                  sx={{
                    background: "linear-gradient(135deg, #5A4BDA 0%, #4838B2 100%)",
                    borderRadius: "12px",
                    px: 3,
                    py: 1.25,
                    textTransform: "none",
                    gap: 1.5,
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    boxShadow: "0 6px 18px rgba(90, 75, 218, 0.35)",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    border: "none",
                    color: "#fff",
                    "&:hover": {
                      background: "linear-gradient(135deg, #4838B2 0%, #362A8C 100%)",
                      boxShadow: "0 8px 22px rgba(90, 75, 218, 0.5)",
                      transform: "translateY(-2px)",
                    },
                    "&:active": {
                      transform: "translateY(0px)",
                    }
                  }}
                >
                  {!docLoader ? (<span className="icon-document-download" style={{ fontSize: '12px' }} />) : (<CircularProgress color="inherit" size={20} />)}
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: "0.75rem", lineHeight: 1 }}>
                    Download Records
                  </Typography>

                </Button>
              </Box>

              <Box
                sx={{
                  maxHeight: 300,
                  overflowY: "auto",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                }}
              >
                {selectedRow?.meta_excel?.map((record: Record<string, any>, recIndex: number) => (
                  <Box
                    key={recIndex}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderBottom: recIndex < selectedRow.meta_excel.length - 1 ? "1px solid #f0f0f0" : "none",
                      backgroundColor: recIndex % 2 === 0 ? "#fafafa" : "#fff",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#5A4BDA", mb: 0.5 }}>
                      Record {recIndex + 1}
                    </Typography>

                    {Object.entries(record)
                      .filter(([, value]) => value !== "" && value !== null && value !== undefined)
                      .map(([key, value]) => (
                        <Box
                          key={key}
                          sx={{ display: "flex", gap: 1, mb: 0.25 }}
                        >
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(58,53,65,0.6)", minWidth: 90 }}>
                            {key}:
                          </Typography>
                          <Typography sx={{ fontSize: "0.8rem", color: "rgba(58,53,65,0.87)" }}>
                            {String(value)}
                          </Typography>
                        </Box>
                      ))}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EdulearnDocuments;