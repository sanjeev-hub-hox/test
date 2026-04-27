'use client'

import { useState, useEffect } from 'react'
import { getLocalStorageVal } from 'src/utils/helper'

import {
    Box,
    Button,
    Grid,
    TextField,
    Typography,
    CircularProgress,
    MenuItem
} from '@mui/material'
import { getRequest } from 'src/services/apiService'
import { useGlobalContext } from 'src/@core/global/GlobalContext'

const REPORT_TYPES = [
    {
        label: 'LC Process Report',
        value: 'lc_process_report',
        permission: 'request_listing_report', //* not fix it; default for now
        api: '/student-process-requests/getProcessReports'
    },
    {
        label: 'Bonafide Report',
        value: 'bonafide_report',
        permission: 'request_listing_report', //* not fix it; default for now
        api: '/student-process-requests/getBonafideReports'
    }
]

const RequestReports = () => {

    const userInfo = getLocalStorageVal('userInfo')
    const userInfoDetails = userInfo ? JSON.parse(userInfo) : {}
    const userPermissions = userInfoDetails?.permissions || []
    const availableReports = REPORT_TYPES.filter(report => userPermissions.includes(report.permission))

    const { setPagePaths } = useGlobalContext()

    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [loading, setLoading] = useState(false)

    const [errors, setErrors] = useState<{
        startDate?: string
        endDate?: string
        reportType?: string
    }>({})

    const [reportType, setReportType] = useState('')

    /* ---------------- Breadcrumb ---------------- */
    useEffect(() => {
        setPagePaths([
            { title: 'Request Listing', path: '/request-listing' },
            { title: 'Report', path: '/request-listing/report' }
        ])
    }, [])

    /* ---------------- Validate Dates ---------------- */
    const validateDates = () => {
        const newErrors: any = {}

        if (!reportType) {
            newErrors.reportType = 'Please select report type'
        }

        if (!startDate) {
            newErrors.startDate = 'Start date is required'
        }

        if (!endDate) {
            newErrors.endDate = 'End date is required'
        }

        if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)

            if (start > end) {
                newErrors.endDate = 'End date must be after start date'
            }

            const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000
            if (end.getTime() - start.getTime() > ONE_YEAR_MS) {
                newErrors.endDate = 'Date range cannot exceed 1 year'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }


    /* ---------------- Download CSV ---------------- */
    const handleDownload = async () => {

        if (!reportType) {
            setErrors(prev => ({
                ...prev,
                reportType: 'Please select report type'
            }))

            return

        }
        const selectedReport = REPORT_TYPES.find(
            r => r.value === reportType
        )

        if (!selectedReport) 

            return

        if (!validateDates())

            return




        setLoading(true)
        try {
            const apiRequest = {
                url: `${selectedReport.api}?start_date=${startDate}&end_date=${endDate}`,
                serviceURL: 'admin',
                responseType: 'blob'
            }

            const response: any = await getRequest(apiRequest)

            const blob = new Blob([response], {
                type: 'text/csv;charset=utf-8;'
            })

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')

            link.href = url
            link.setAttribute(
                'download',
                `${selectedReport.label} ${startDate} to ${endDate}.csv`
            )

            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box
            sx={{
                background: '#fff',
                borderRadius: '12px',
                p: 4
            }}
        >
            <Typography variant='h5' sx={{ fontWeight: 600, mb: 3 }}>
                Process Report
            </Typography>

            <Grid container spacing={3}>

                {/* Report Type */}
                <Grid item xs={12}>
                    <TextField
                        select
                        fullWidth
                        label="Select Report Type"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        error={!!errors.reportType}
                        helperText={errors.reportType}
                    >
                        {availableReports.map((report) => (
                            <MenuItem key={report.value} value={report.value}>
                                {report.label}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                {/* Start Date */}
                <Grid item xs={12} md={6}>
                    <TextField
                        type='date'
                        label='Start Date'
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={startDate}
                        onChange={e => {
                            setStartDate(e.target.value)
                            setErrors(prev => ({ ...prev, startDate: undefined }))
                        }}
                        error={!!errors.startDate}
                        helperText={errors.startDate}
                    />
                </Grid>

                {/* End Date */}
                <Grid item xs={12} md={6}>
                    <TextField
                        type='date'
                        label='End Date'
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={endDate}
                        onChange={e => {
                            setEndDate(e.target.value)
                            setErrors(prev => ({ ...prev, endDate: undefined }))
                        }}
                        error={!!errors.endDate}
                        helperText={errors.endDate}
                    />
                </Grid>

            </Grid>

            <Typography
                sx={{
                    mt: 2,
                    fontSize: '0.85rem',
                    color: '#718096',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <span style={{ fontWeight: 600, marginRight: 4 }}>Note:</span>
                This report can be generated for a maximum period of&nbsp;
                <strong>one year</strong>.
            </Typography>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant='contained'
                    color='primary'
                    onClick={handleDownload}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} /> : null}
                >
                    {loading ? 'Downloading…' : 'Download'}
                </Button>
            </Box>
        </Box>
    )
}

export default RequestReports
