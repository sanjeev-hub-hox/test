import {
  Grid,
  Popover,
  Typography,
  useTheme, 
  Badge,
  Button
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import { getRequest, postRequest, getBlobRequest } from 'src/services/apiService'
import {
  getLocalStorageVal
} from 'src/utils/helper'
import ReportFilterDrawer from 'src/@core/CustomComponent/ReportComponent/ReportFilterDrawer'
import { PERMISSIONS } from 'src/utils/constants'
// import { toast } from 'react-hot-toast';

function Reports() {
  const theme = useTheme()
  const { setPagePaths, setGlobalState } = useGlobalContext()
  const [anchorEl, setAnchorEl] = React.useState(null)
  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined
  const handlePopOverClose = () => {
    setAnchorEl(null)
  }

  // end-points for student-wise and class-wise report
  const classWiseEndpoint = `marketing/classwise-report/146/csv`
  const studentWiseEndpoint = `marketing/studentwise-report/146/csv`
  // const [reportFilters, setReportFilters] = useState<any>([])
  const [reportFilterDrawerOpen, setReportFilterDrawerOpen] = useState(false);
  // now for the class-wise and student-wise reports on clicking on them from filters directly we have to open the filter drawer and pass the report type to it 
  const [selectedReportType,setSelectedReportType] = useState<string | null>(null)
  // now for the status of the students ,{id:2,name:'Left'} if needed again
  const studentStatus  =[{id:1,name:'Active'},{id:0,name:'InActive'}];
   // we need to add group by filter for class-wise reports 
   type GroupBy = {
    id: number;
    name: string;
  }
  const groupBy : GroupBy[] = [{id:1,name:'Academic-Year'},{id:2,name:'School'},{id:3,name:'Brand'},{id:4,name:'Board'},{id:5,name:'Grade'},{id:6,name:'Course'},{id:7,name:'Stream'},{id:8,name:'Shift'},{id:9,name:'Division'},{id:10,name:'Terms'},{id:11,name:'Subject'},{id:12,name:'Domain'},{id:13,name:'Sub-domain'},{id:14,name:'Criteria'},{id:15,name:'Co-Ordinator'},{id:16,name:'Teacher'}]
  // State for GR Report dropdown options
  const [grReportOptions, setGrReportOptions] = useState<any>({
    academicYear: [],
    board: [],
    course: [],
    grade: [],
    stream: [],
    batch: []
  })

  // In your Reports component, update the fetchGRReportOptions useEffect
  useEffect(() => {
    const fetchGRReportOptions = async () => {
      try {
        const baseConfig = {
          serviceURL: 'mdm',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
          }
        }

        // Fetch all dropdown data in parallel
        const [academicYearRes, boardRes, courseRes, gradeRes, streamRes, batchRes] = await Promise.all([
          getRequest({ 
            url: '/api/ac-academic-years?pagination[pageSize]=100&sort[0]=id:desc', 
            ...baseConfig 
          }),
          getRequest({ 
            url: '/api/ac-boards?pagination[pageSize]=100', 
            ...baseConfig 
          }),
          getRequest({ 
            url: '/api/ac-courses?pagination[pageSize]=100', 
            ...baseConfig 
          }),
          getRequest({ 
            url: '/api/ac-grades?pagination[pageSize]=100&sort[0]=id:asc', 
            ...baseConfig 
          }),
          getRequest({ 
            url: '/api/ac-streams?pagination[pageSize]=100', 
            ...baseConfig 
          }),
          getRequest({ 
            url: '/api/ac-shifts?pagination[pageSize]=100', 
            ...baseConfig 
          })
        ])

        // Transform responses to dropdown options format
        setGrReportOptions({
          academicYear: academicYearRes?.data?.map((item: any) => ({
            value: item.attributes?.short_name_two_digit,
            label: item.attributes?.name || item.attributes?.short_name || String(item.id)
          })) || [],
          board: boardRes?.data?.map((item: any) => ({
            value: item.id,
            label: item.attributes?.name || String(item.id)
          })) || [],
          course: courseRes?.data?.map((item: any) => ({
            value: item.id,
            label: item.attributes?.name || String(item.id)
          })) || [],
          // CHANGED: Use item.id instead of item.attributes?.name for grade value
          grade: gradeRes?.data?.map((item: any) => ({
            value: item.id,  // ← Send ID to backend
            label: item.attributes?.name || String(item.id)  // ← Display name to user
          })) || [],
          stream: streamRes?.data?.map((item: any) => ({
            value: item.id,
            label: item.attributes?.name || String(item.id)
          })) || [],
          batch: batchRes?.data?.map((item: any) => ({
            value: item.id,
            label: item.attributes?.name || String(item.id)
          })) || []
        })

        // console.log('GR Report Options Loaded:', {
        //   academicYear: academicYearRes?.data?.length,
        //   board: boardRes?.data?.length,
        //   course: courseRes?.data?.length,
        //   grade: gradeRes?.data?.length,
        //   stream: streamRes?.data?.length,
        //   batch: batchRes?.data?.length
        // })

      } catch (error) {
        // console.error('Error fetching GR Report dropdown options:', error)
      }
    }

    fetchGRReportOptions()
  }, [])

  
  // define the csOptions
  const [csReportOptions,setCsReportOptions] = useState({
    academicYear:[], 
    terms:[], 
    subject:[],
    domain:[],
    subdomain:[],
    criteria:[], // as of now we are going to keep them in the independent fetch only as with current school-search api they are not related so 

    school:[],brand:[],board:[],grade:[],course:[],stream:[],shift:[],division:[] , teachers:[],coordinators:[],students:[]// we are going to fetch them dynamically based on the combination 
  })  

  // as we will now implement the lazy loading as the some options are independent or we will later transfer this useEffect inside report filter download too , so that it will not bloat the page 
  useEffect(()=>{

    // now we will fetch the independent options here only when filtered report is open and class-wise and student-wise options are opend 
    if(!reportFilterDrawerOpen) return; 

       
      // to prevent-refetching  
      if(csReportOptions.academicYear.length > 0) return; 

      // now we need to fetch the independent options 
      const fetchCSReportOptions = async() => {
        try {
          const baseConfig =  {
            serviceURL : 'mdm',
            headers : {Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}` }
          } 

         const[academicYearRes] =await Promise.all([
            getRequest({url:'/api/ac-academic-years?pagination[pageSize]=100',...baseConfig}),
           
           
          ]);
          // now we need to transform them and set them 
          setCsReportOptions((prev:any)=>({ 
            ...prev,
            // now from data we are checking if it is allowed means is_visible as well as acitve then only display it
            academicYear: academicYearRes?.data?.filter((item:any)=>{
              return item.attributes?.is_visible!==0 && item.attributes?.is_active===true
            }).map((item: any) => ({
            value: item.attributes?.short_name_two_digit,
            label: item.attributes?.name || item.attributes?.short_name || String(item.id)
            })) || [],
           // as eariler we ere using the text field for the teacher coordinator and student now we have added state for them so we can fetch and store options
           school:[],brand:[],board:[],grade:[],course:[],stream:[],shift:[],division:[],subject: [], domain: [], subdomain: [], criteria: [],students: [], coordinators:[],teachers:[]
          }))
          
        }catch(err) {

         // console.log('error fetching the cs report dropdown options ',err);
        } 

       
      }
       fetchCSReportOptions()
    

  },[selectedReportType,csReportOptions.academicYear.length,reportFilterDrawerOpen,])

  //! Define report configurations
  const userInfo = getLocalStorageVal('userInfo')
  const user = userInfo ? JSON.parse(userInfo) : {}
  const userPermissions = user?.permissions || []
  
  let REPORT_CONFIGS = [
    {
      value: 'enquiry',
      label: 'Enquiry Details',
      description: 'Download complete enquiry details report',
      endpoint: 'marketing/enquiry/ay/enquiry-report',
      method: 'GET',
      filters: [],
      filteredEndpoint: undefined
    },
    {
      value: 'admission',
      label: 'Enquiry To Admission',
      description: 'Download enquiry to admission conversion report',
      endpoint: 'marketing/enquiry/ay/admission-enquiry-report',
      method: 'GET',
      filters: [],
      filteredEndpoint: undefined
    },
    {
      value: 'daily',
      label: 'Enquiry To Daily Appointment',
      description: 'Download daily appointment report for the selected date range',
      endpoint: 'marketing/enquiry/ay/appointment-report',
      method: 'POST',
      filters: [
        {
          name: 'dateRange',
          label: 'Date Range',
          type: 'dateRange',
          key: 'date_range',
          required: true
        }
      ],
      filteredEndpoint: undefined
    },
    {
      value: 'sourceConversion',
      label: 'Source Wise Conversion Report',
      description: 'Download source wise conversion report',
      endpoint: 'marketing/enquiry/ay/source-conversion-report',
      method: 'POST',
      filters: [
        {
          name: 'dateRange',
          label: 'Date Range',
          type: 'dateRange',
          key: 'date_range',
          required: false
        },
        {
          name: 'groupBy',
          label: 'Group By',
          type: 'multiselect',
          key: 'group_by',
          options: [
            { value: 'cluster', label: 'Cluster' },
            { value: 'school', label: 'School' },
            { value: 'source', label: 'Source' },
            { value: 'subSource', label: 'Sub Source' },
          ],
          required: false
        },
        {
          name: 'filters',
          label: 'Filters',
          type: 'multiselect',
          key: 'filters',
          options: [
            { value: 'CC Only', label: 'CC Only' },
            { value: 'School Only', label: 'School Only' },
            { value: 'all', label: 'All' },
          ],
          required: false
        }
      ]
    },
    {
      value: 'sourceInquiryStatus',
      label: 'Source Wise Inquiry Status Report_BA',
      description: 'Download source wise inquiry status report_BA',
      endpoint: 'marketing/enquiry/ay/source-wise-conversion-report',
      method: 'GET',
      filters: [
        {
          name: 'dateRange',
          label: 'Date Range',
          type: 'dateRange',
          key: 'date_range',
          required: false
        },
        {
          name: 'groupBy',
          label: 'Group By',
          type: 'multiselect',
          key: 'group_by',
          options: [
            { value: 'cluster', label: 'Cluster' },
            { value: 'school', label: 'School' },
            { value: 'course', label: 'Course' },
            { value: 'board', label: 'Board' },
            { value: 'grade', label: 'Grade' },
            { value: 'stream', label: 'Stream' },
            { value: 'source', label: 'Source' },
            { value: 'subSource', label: 'Sub Source' },
          ],
          required: false
        },
        {
          name: 'filters',
          label: 'Filters',
          type: 'multiselect',
          key: 'filters',
          options: [
            { value: 'cluster', label: 'Cluster' },
            { value: 'school', label: 'School' },
            { value: 'course', label: 'Course' },
            { value: 'board', label: 'Board' },
            { value: 'grade', label: 'Grade' },
            { value: 'stream', label: 'Stream' },
            { value: 'source', label: 'Source' },
            { value: 'subSource', label: 'Sub Source' },
          ],
          required: false
        }
      ]
    },
    {
      value: 'student-profile-summary',
      label: 'Student Profile Summary',
      description: 'Download student profile summary report',
      endpoint: 'marketing/enquiry/metabase/student-profile-summary',
      method: 'GET',
      filters: [
        {
          name: 'groupBy',
          label: 'Group By',
          type: 'multiselect',
          key: 'group_by',
          options: [
            { value: 'shift', label: 'Shift' },
            { value: 'course', label: 'Course' },
            { value: 'board', label: 'Board' },
            { value: 'grade', label: 'Grade' },
            { value: 'stream', label: 'Stream' },
            { value: 'division', label: 'Division' }
          ],
          required: false
        },
        {
          name: 'filters',
          label: 'Filters',
          type: 'multiselect',
          key: 'filterType',
          options: [
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
            { value: 'All', label: 'All' },
            { value: 'shift', label: 'Shift' },
            { value: 'course', label: 'Course' },
            { value: 'board', label: 'Board' },
            { value: 'grade', label: 'Grade' },
            { value: 'stream', label: 'Stream' },
            { value: 'division', label: 'Division' }
          ],
          required: false
        }
      ],
      filteredEndpoint: undefined
    },
    {
      value: 'student-profile-details',
      label: 'Student Profile Details',
      description: 'Download student profile details report',
      endpoint: 'marketing/enquiry/metabase/student-profile-details',
      method: 'GET',
      filters: [],
      filteredEndpoint: undefined
    },
    {
      value: 'outside-tat',
      label: 'Outside TAT Follow up',
      description: 'Download outside TAT follow up report',
      endpoint: '/marketing/enquiry/ay/outside-tat-followup-report',
      method: 'POST',
      filters: [
        {
          name: 'filterType',
          label: 'Filters',
          type: 'multiselect',
          key: 'filterType',
          options: [
            { value: 'CC Only', label: 'CC Only' },
            { value: 'School Only', label: 'School Only' },
            { value: 'All', label: 'All' }
          ],
          required: false
        }
      ],
      filteredEndpoint: undefined
    },
    {
      value: 'gr-report',
      label: 'GR Report',
      description: 'Download GR report with filters',
      endpoint: 'marketing/enquiry/metabase/gr-report',
      method: 'POST',
      filters: [
        {
          name: 'academicYear',
          label: 'Academic Year',
          type: 'select',
          key: 'academic_year',
          options: grReportOptions.academicYear,
          required: false
        },
        {
          name: 'board',
          label: 'Board',
          type: 'select',
          key: 'board',
          options: grReportOptions.board,
          required: false
        },
        {
          name: 'course',
          label: 'Course',
          type: 'select',
          key: 'course',
          options: grReportOptions.course,
          required: false
        },
        {
          name: 'grade',
          label: 'Grade',
          type: 'multiselect',
          key: 'grade',
          options: grReportOptions.grade,
          required: false,
          defaultValue: grReportOptions.grade.map((g: any) => g.value)
        },
        {
          name: 'stream',
          label: 'Stream',
          type: 'select',
          key: 'stream',
          options: grReportOptions.stream,
          required: false
        },
        {
          name: 'batch',
          label: 'Batch',
          type: 'select',
          key: 'batch',
          options: grReportOptions.batch,
          required: false
        }
      ],
      filteredEndpoint: 'marketing/enquiry/metabase/gr-report'
    },
    {
      value: 'class-wise',
      label: 'Class Wise Report',
      description:'Download Class Wise Report with filters',
      endpoint: classWiseEndpoint,
      method: 'GET',
      filters: [
        {name: 'group_by',label:'Group By',key:'groupby_id',type:'multiselect',options:groupBy.map((item:any)=> ({value:item.id,label:item.name}))},
        {name:'student_status',label:'Student Status',key:'status_id',type:'select',required:true,options:studentStatus.map((item:any)=>({value:item.id,label:item.name}))},
        { name: 'academicYear', label: 'Academic Year', key: 'academic_year_id', type: 'select', options: csReportOptions.academicYear, required: true },
        { name: 'school', label: 'School', key: 'school_id', type: 'select', options: csReportOptions.school, required: true },
        { name: 'brand', label: 'Brand', key: 'brand_id', type: 'select', options: csReportOptions.brand },
        { name: 'board', label: 'Board', key: 'board_id', type: 'select', options: csReportOptions.board },
        { name: 'grade', label: 'Grade', key: 'grade_id', type: 'select', options: csReportOptions.grade },
        { name: 'course', label: 'Course', key: 'course_id', type: 'select', options: csReportOptions.course },
        { name: 'stream', label: 'Stream', key: 'stream_id', type: 'select', options: csReportOptions.stream },
        { name: 'shift', label: 'Shift', key: 'shift_id', type: 'select', options: csReportOptions.shift },
        { name: 'division', label: 'Division', key: 'division_id', type: 'select', options: csReportOptions.division },
        { name: 'terms', label: 'Terms', key: 'terms_id', type: 'select', options: csReportOptions.terms },
        { name: 'subject', label: 'Subject', key: 'subject_id', type: 'select', options: csReportOptions.subject },
        { name: 'domain', label: 'Domain', key: 'domain_id', type: 'select', options: csReportOptions.domain },
        { name: 'subdomain', label: 'Subdomain', key: 'subdomain_id', type: 'select', options: csReportOptions.subdomain },
        { name: 'criteria', label: 'Criteria', key: 'criteria_id', type: 'select', options: csReportOptions.criteria },
        { name: 'coordinatorName', label: 'Coordinator Name', key: 'coordinator_code', type: 'select', options:csReportOptions.coordinators }, // in next iteration we need to give them as select
        { name: 'teacherName', label: 'Teacher Name', key: 'teacher_code', type: 'select', options:csReportOptions.teachers }, // in next iteration we need to give them as select
        
      ]
    },
    {
      value: 'student-wise',
      label: 'Student Wise Report',
      endpoint: studentWiseEndpoint,
      description:'Download Student Wise Report with filters',
      method: 'GET',
      filters: [
        {name:'student_status',label:'Student Status',key:'status_id',type:'select',required:true,options:studentStatus.map((item:any)=>({value:item.id,label:item.name}))},
        { name: 'academicYear', label: 'Academic Year', key: 'academic_year_id', type: 'select', options: csReportOptions.academicYear, required: true },
        { name: 'school', label: 'School', key: 'school_id', type: 'select', options: csReportOptions.school, required: true },
        { name: 'brand', label: 'Brand', key: 'brand_id', type: 'select', options: csReportOptions.brand, required: true },
        { name: 'board', label: 'Board', key: 'board_id', type: 'select', options: csReportOptions.board, required: true },
        { name: 'grade', label: 'Grade', key: 'grade_id', type: 'select', options: csReportOptions.grade, required:true },
        { name: 'course', label: 'Course', key: 'course_id', type: 'select', options: csReportOptions.course, required: true },
        { name: 'stream', label: 'Stream', key: 'stream_id', type: 'select', options: csReportOptions.stream, required:true },
        { name: 'shift', label: 'Shift', key: 'shift_id', type: 'select', options: csReportOptions.shift, required: true },
        { name: 'division', label: 'Division', key: 'division_id', type: 'select', options: csReportOptions.division, required: true },
        { name: 'terms', label: 'Terms', key: 'terms_id', type: 'select', options: csReportOptions.terms },
        { name: 'subject', label: 'Subject', key: 'subject_id', type: 'select', options: csReportOptions.subject },
        { name: 'domain', label: 'Domain', key: 'domain_id', type: 'select', options: csReportOptions.domain },
        { name: 'subdomain', label: 'Subdomain', key: 'subdomain_id', type: 'select', options: csReportOptions.subdomain },
        { name: 'criteria', label: 'Criteria', key: 'criteria_id', type: 'select', options: csReportOptions.criteria },
        
        //{ name: 'studentId', label: 'Student ID', key: 'student_id', type: 'text' }, // removing it completely 
        { name: 'coordinatorName', label: 'Coordinator Name', key: 'coordinator_code', type: 'select', options:csReportOptions.coordinators }, // we need to pass the employee_code or something like that need to check
        { name: 'teacherName', label: 'Teacher Name', key: 'teacher_code', type: 'select', options:csReportOptions.teachers }, // we need to pass the employee_code or something like that now need to check now
        { name: 'studentName', label: 'Student Name', key: 'student_id', type: 'select' , options:csReportOptions.students}, // in next iteration we need to give them as select 
       
      ]
    }
  ]
  
  if (!userPermissions.includes(PERMISSIONS.SOURCE_WISE_CONVERSION_REPORT)) {
    REPORT_CONFIGS = REPORT_CONFIGS.filter(r => r.value !== 'sourceConversion')
  }
  if (!userPermissions.includes(PERMISSIONS.SOURCE_INQUIRY_STATUS_REPORT)) {
    REPORT_CONFIGS = REPORT_CONFIGS.filter(r => r.value !== 'sourceInquiryStatus')
  }
  if (!userPermissions.includes(PERMISSIONS?.OUTSIDE_TAT_FOLLOWUP)) {
    REPORT_CONFIGS = REPORT_CONFIGS.filter(r => r.value !== 'outside-tat')
  }

  //Passing Breadcrumbs
  useEffect(() => {
    setPagePaths([
      {
        title: 'Reports',
        path: '/reports'
      }
    ])
  }, [])


  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiRequest = {
          url: `/api/ac-academic-years?fields[1]=name&fields[2]=short_name&fields[3]=short_name_two_digit&fields[4]=is_visible&filters[is_visible][$eq]=1&sort[0]=id:asc`,
          serviceURL: 'mdm',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
          }
        }
        await getRequest(apiRequest)
        // Handle the response here, e.g., set the state with the data
       
      } catch (error) {
        // console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const handleReportDownload = async (type: string) => {

    // as student-wise and class-wise reports must be used with filters
    if (type === 'class-wise' || type === 'student-wise') {
      // toast('Please select a School and Academic Year to generate this report.', {
      //   icon: 'ℹ️',
      // });
      setSelectedReportType(type); 
      setReportFilterDrawerOpen(true);
      return; // Stop the function here so no API calls are made!
    }
    setGlobalState({ isLoading: true })
    let endpoint = null;
    if (type == 'enquiry') {
      endpoint = `marketing/enquiry/ay/enquiry-report`
    } else if (type == 'admission') {
      endpoint = `marketing/enquiry/ay/admission-enquiry-report`
    } else if (type == 'daily') {
      endpoint = `marketing/enquiry/ay/appointment-report`
    } else if(type =='sourceConversion'){
      endpoint = `marketing/enquiry/ay/source-conversion-report`
    } else if (type == 'sourceInquiryStatus') {
      endpoint = `marketing/enquiry/ay/source-wise-conversion-report`
    } else if (type == 'student-profile-summary') {
      endpoint = `marketing/enquiry/metabase/student-profile-summary`
    } else if (type == 'student-profile-details') {
      endpoint = `marketing/enquiry/metabase/student-profile-details`
    } else if (type == 'gr-report') {
      endpoint = `marketing/enquiry/metabase/gr-report`
    } else if (type == 'outside-tat') {
      endpoint = `/marketing/enquiry/ay/outside-tat-followup-report`
      const userInfo = getLocalStorageVal('userInfo')
      let schoolIds: any[] = []

      // console.log('Retrieved userInfo from localStorage:', userInfo)

      if (userInfo) {
        try {
          const parsedUserInfo = JSON.parse(userInfo)
          // console.log('Parsed userInfo:', parsedUserInfo)

          if (parsedUserInfo?.userInfo?.schoolIds && Array.isArray(parsedUserInfo?.userInfo?.schoolIds) && parsedUserInfo?.userInfo?.schoolIds.length > 0) {
            schoolIds = parsedUserInfo?.userInfo?.schoolIds
          }
        } catch (error) {
          // console.error('Error parsing userInfo:', error)
        }
      }

      // console.log('Final schoolIds to use:', schoolIds)
      endpoint += `?school_id=[${schoolIds.join(',')}]`
    }

    const reportConfig = REPORT_CONFIGS.find(r => r.value === type);
    const method = reportConfig?.method || 'GET';

    const apiRequest = {
      url: endpoint,
    }

    const response = method === 'GET'
      ? await getRequest(apiRequest)
      : await postRequest(apiRequest)

    if (response?.status) {
      const fileUrl = response?.data?.file_url || response?.data?.url
      const fileName = response.data.fileName
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    setGlobalState({isLoading:false})
  }
  
  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFilteredReportDownload = async (reportType: string, filters: any) => {
    if (!reportType) return;

    const reportConfig = REPORT_CONFIGS.find(r => r.value === reportType);
    if (!reportConfig) return;

    const isBlobReport = reportType === 'class-wise' || reportType === 'student-wise';
    const { method, endpoint } = reportConfig;
    const appliedFilters = filters || {};
    const textArrayFields = ['teacher_name', 'coordinator_name', 'student_name', 'student_id'];

    textArrayFields.forEach(field => {
      // If the user typed something in this field and it's a string
      if (appliedFilters[field] && typeof appliedFilters[field] === 'string') {
        // Split by comma, clean up extra spaces, and remove empty entries
        appliedFilters[field] = appliedFilters[field]
          .split(',')
          .map((name: string) => name.trim())
          .filter((name: string) => name.length > 0);
      }
    });

    try {
      setGlobalState({ isLoading: true });

      const apiRequest = {
        url: endpoint,
        ...(method === 'POST' && { data: appliedFilters })
      };

      if (reportType === 'outside-tat' && appliedFilters?.filterType) {
        apiRequest.data = {
          ...appliedFilters,
          filters: appliedFilters.filterType
        }
        delete apiRequest.data.filterType;
      }

      if (reportType === 'student-profile-summary' && appliedFilters?.filterType) {
        appliedFilters.filters = appliedFilters.filterType
        delete appliedFilters.filterType
      }
      if (isBlobReport) {
        // --- NEW: BLOB REPORT HANDLING WITH FILTERS ---

        // 1. Ensure we always have an academic year ID fallback
        if (!appliedFilters.academic_year_id) {
          appliedFilters.academic_year_id = String(new Date().getFullYear()).slice(-2);
        }

        // 2. Build URL perfectly (strips array brackets: school_id[]=45 -> school_id=45)
        const queryParams = new URLSearchParams();
        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(val => queryParams.append(key, String(val)));
          } else if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value as string));
          }
        });

        let blobData: Blob | null = null;


        // PRODUCTION: Use apiService
        const exactRequest = {
          url: endpoint,
          params: queryParams,
        };
        const response = await getBlobRequest(exactRequest);

        // Verify it's file data
        if (response instanceof Blob) {
          blobData = response;
        } else if (response && !response.error) {
          blobData = new Blob([response as BlobPart]);
        }


        // 3. Download Blob
        if (blobData) {
          const url = window.URL.createObjectURL(blobData);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${reportConfig.label.replace(/\s+/g, '_')}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      } else {


      const response =
        method === 'GET'
          ? await getRequest({ ...apiRequest, params: appliedFilters })
          : await postRequest(apiRequest);

      if (response?.data?.url || response?.data?.file_url) {
        downloadFile(response.data.url || response.data.file_url, `${reportConfig.label}.xlsx`);
        }
      }
    } catch (err) {
      // console.error('Download error:', err);
    } finally {
      setGlobalState({ isLoading: false });
    }
  };

  return (
    <>
      <Box sx={{ background: '#fff', borderRadius: '10px', padding: '16px', mt: 2 }}>
        <Box sx={{ background: '#fff', padding: '8px', display: 'flex', justifyContent: 'end' }}>
          <Badge
            color='error'
            sx={{
              '& .MuiBadge-badge': {
                width: '20px',
                height: '20px',
                top: 7,
                right: 20,
                zIndex: 1
              }
            }}
          >
            <Button
              variant='contained'
              color='inherit'
              sx={{
                mr: 3,
                '@media (max-width: 910px)': {
                  ml: 3
                }
              }}
              startIcon={<span className='icon-filter-search'></span>}
              onClick={() => setReportFilterDrawerOpen(true)}
            >
              filter
            </Button>
          </Badge>
        </Box>
        <Grid container spacing={7} xs={12} sx={{ pt: 0, mt: 2, ml: -3.5 }}>
          <Grid
            item
            xs={12}
            md={4}
            lg={4}
            sx={{ '&.MuiGrid-item': { paddingTop: '0px !important', cursor: 'pointer' } }}
            onClick={() => {
              handleReportDownload('enquiry')
            }}
          >
            <Box
              sx={{
                mb: 8,
                padding: '24px',
                borderRadius: '10px',
                background: theme.palette.customColors.surface2,
                boxShadow: '0px 2px 10px 0px #4C4E6438'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                  <Box sx={{ ml: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                      <Typography
                        variant='subtitle2'
                        color={'text.primary'}
                        sx={{ textTransform: 'capitalize', lineHeight: '18px', cursor: 'pointer' }}
                      >
                        Enquiry Details
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
          {/* Add other report Grid items similarly... */}
          <Grid
            item
            xs={12}
            md={4}
            lg={4}
            sx={{ '&.MuiGrid-item': { paddingTop: '0px !important', cursor: 'pointer' } }}
            onClick={() => {
              handleReportDownload('admission')
            }}
          >
            <Box
              sx={{
                mb: 8,
                padding: '24px',
                borderRadius: '10px',
                background: theme.palette.customColors.surface2,
                boxShadow: '0px 2px 10px 0px #4C4E6438'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                  <Box sx={{ ml: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                      <Typography
                        variant='subtitle2'
                        color={'text.primary'}
                        sx={{ textTransform: 'capitalize', lineHeight: '18px', cursor: 'pointer' }}
                      >
                        Enquiry To Admission
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            md={4}
            lg={4}
            sx={{ '&.MuiGrid-item': { paddingTop: '0px !important', cursor: 'pointer' } }}
            onClick={() => {
              handleReportDownload('daily')
            }}
          >
            <Box
              sx={{
                mb: 8,
                padding: '24px',
                borderRadius: '10px',
                background: theme.palette.customColors.surface2,
                boxShadow: '0px 2px 10px 0px #4C4E6438'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                  <Box sx={{ ml: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                      <Typography
                        variant='subtitle2'
                        color={'text.primary'}
                        sx={{ textTransform: 'capitalize', lineHeight: '18px', cursor: 'pointer' }}
                      >
                        Daily Appointment Report
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* <Can pagePermission={[PERMISSIONS.SOURCE_WISE_CONVERSION_REPORT]} action="HIDE"> */}
            <Grid item xs={12} md={4} lg={4} sx={{ '&.MuiGrid-item': { paddingTop: '0px !important', cursor: 'pointer' } }} onClick={() => handleReportDownload('sourceConversion')}>
              <Box
                sx={{
                  mb: 8,
                  padding: '24px',
                  borderRadius: '10px',
                  background: theme.palette.customColors.surface2,
                  boxShadow: '0px 2px 10px 0px #4C4E6438'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                    <Box sx={{ ml: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Typography
                          variant='subtitle2'
                          color={'text.primary'}
                          sx={{ textTransform: 'capitalize', lineHeight: '18px', cursor: 'pointer' }}
                        >
                          Source Wise Conversion Report
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          {/* </Can> */}
          {/* <Can pagePermission={[PERMISSIONS.SOURCE_INQUIRY_STATUS_REPORT]} action="HIDE"> */}
            <Grid item xs={12} md={4} lg={4} sx={{ '&.MuiGrid-item': { paddingTop: '0px !important', cursor: 'pointer' } }} onClick={() => handleReportDownload('sourceInquiryStatus')}>
              <Box
                sx={{
                  mb: 8,
                  padding: '24px',
                  borderRadius: '10px',
                  background: theme.palette.customColors.surface2,
                  boxShadow: '0px 2px 10px 0px #4C4E6438'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                    <Box sx={{ ml: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Typography
                          variant='subtitle2'
                          color={'text.primary'}
                          sx={{ textTransform: 'capitalize', lineHeight: '18px', cursor: 'pointer' }}
                        >
                          Source Wise Inquiry Status Report_BA
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          {/* </Can> */}
          
          {/* <Can pagePermission={[PERMISSIONS?.STUDENT_PROFILE_SUMMARY_REPORT]} action={'HIDE'}> */}
            <Grid item xs={12} md={4} lg={4} sx={{ '&.MuiGrid-item': { paddingTop: '0px !important', cursor: 'pointer' } }} onClick={() => handleReportDownload('student-profile-summary')}>
              <Box
                sx={{
                  mb: 8,
                  padding: '24px',
                  borderRadius: '10px',
                  background: theme.palette.customColors.surface2,
                  boxShadow: '0px 2px 10px 0px #4C4E6438'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                    <Box sx={{ ml: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Typography
                          variant='subtitle2'
                          color={'text.primary'}
                          sx={{ textTransform: 'capitalize', lineHeight: '18px', cursor: 'pointer' }}
                        >
                          Student Profile Summary
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          {/* </Can> */}
          {/* <Can pagePermission={[PERMISSIONS?.STUDENT_PROFILE_REPORT]} action={'HIDE'}> */}
            <Grid
              item
              xs={12}
              md={4}
              lg={4}
              sx={{ '&.MuiGrid-item': { paddingTop: '0px !important', cursor: 'pointer' } }}
              onClick={() => {
                handleReportDownload('student-profile-details')
              }}
            >
              <Box
                sx={{
                  mb: 8,
                  padding: '24px',
                  borderRadius: '10px',
                  background: theme.palette.customColors.surface2,
                  boxShadow: '0px 2px 10px 0px #4C4E6438'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                    <Box sx={{ ml: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Typography
                          variant='subtitle2'
                          color={'text.primary'}
                          sx={{ textTransform: 'capitalize', lineHeight: '18px', cursor: 'pointer' }}
                        >
                          Student Profile Details
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          {/* </Can> */}
          {/* <Can pagePermission={[PERMISSIONS?.OUTSIDE_TAT_FOLLOWUP]} action={'HIDE'}> */}
            <Grid
              item
              xs={12}
              md={4}
              lg={4}
              sx={{ '&.MuiGrid-item': { paddingTop: '0px !important', cursor: 'pointer' } }}
              onClick={() => {
                handleReportDownload('outside-tat')
              }}
            >
              <Box
                sx={{
                  mb: 8,
                  padding: '24px',
                  borderRadius: '10px',
                  background: theme.palette.customColors.surface2,
                  boxShadow: '0px 2px 10px 0px #4C4E6438'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                    <Box sx={{ ml: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Typography
                          variant='subtitle2'
                          color={'text.primary'}
                          sx={{ textTransform: 'capitalize', lineHeight: '18px', cursor: 'pointer' }}
                        >
                          Outside TAT Follow up
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          {/* </Can> */}
          {/* <Can pagePermission={[PERMISSIONS?.GR_REPORT]} action={'HIDE'}> */}
            <Grid
              item
              xs={12}
              md={4}
              lg={4}
              sx={{ '&.MuiGrid-item': { paddingTop: '0px !important', cursor: 'pointer' } }}
              onClick={() => {
                handleReportDownload('gr-report')
              }}
            >
              <Box
                sx={{
                  mb: 8,
                  padding: '24px',
                  borderRadius: '10px',
                  background: theme.palette.customColors.surface2,
                  boxShadow: '0px 2px 10px 0px #4C4E6438'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                    <Box sx={{ ml: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Typography
                          variant='subtitle2'
                          color={'text.primary'}
                          sx={{ textTransform: 'capitalize', lineHeight: '18px', cursor: 'pointer' }}
                        >
                          GR Report
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          {/* </Can> */}
          <Grid
            item
            xs={12}
            md={4}
            lg={4}
            sx={{ '&.MuiGrid-item': { paddingTop: '0px !important', cursor: 'pointer' } }}
            onClick={() => {
              handleReportDownload('class-wise')
            }}
          >
            <Box
              sx={{
                mb: 8,
                padding: '24px',
                borderRadius: '10px',
                background: theme.palette.customColors.surface2,
                boxShadow: '0px 2px 10px 0px #4C4E6438'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                  <Box sx={{ ml: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                      <Typography
                        variant='subtitle2'
                        color={'text.primary'}
                        sx={{ textTransform: 'capitalize', lineHeight: '18px', cursor: 'pointer' }}
                      >
                        Class Wise Report
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            md={4}
            lg={4}
            sx={{ '&.MuiGrid-item': { paddingTop: '0px !important', cursor: 'pointer' } }}
            onClick={() => {
              handleReportDownload('student-wise')
            }}
          >
            <Box
              sx={{
                mb: 8,
                padding: '24px',
                borderRadius: '10px',
                background: theme.palette.customColors.surface2,
                boxShadow: '0px 2px 10px 0px #4C4E6438'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                  <Box sx={{ ml: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                      <Typography
                        variant='subtitle2'
                        color={'text.primary'}
                        sx={{ textTransform: 'capitalize', lineHeight: '18px', cursor: 'pointer' }}
                      >
                        Student Wise Report
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <ReportFilterDrawer
        isOpen={reportFilterDrawerOpen}
        onClose={() =>{ setReportFilterDrawerOpen(false); setSelectedReportType(null);}}
        selectedReportType={selectedReportType}
        onDownload={(reportType, filters) => handleFilteredReportDownload(reportType, filters)}
        reportConfigs={REPORT_CONFIGS}
      />

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopOverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
      >
        <Typography variant='subtitle1' sx={{ textTransform: 'capitalize', mb: 2 }}>
          {' '}
          <Link style={{ color: theme.palette.customColors.mainText, fontSize: '16px', lineHeight: '17.6px' }} href='#'>
            Registration
          </Link>
        </Typography>
        <Typography variant='subtitle1' sx={{ textTransform: 'capitalize', mb: 2 }}>
          {' '}
          <Link style={{ color: theme.palette.customColors.mainText, fontSize: '16px', lineHeight: '17.6px' }} href='#'>
            Email
          </Link>
        </Typography>
        <Typography variant='subtitle1' sx={{ textTransform: 'capitalize', mb: 2 }}>
          <Link style={{ color: theme.palette.customColors.mainText, fontSize: '16px', lineHeight: '17.6px' }} href='#'>
            School Tour
          </Link>
        </Typography>
        <Typography variant='subtitle1' sx={{ textTransform: 'capitalize', mb: 2 }}>
          {' '}
          <Link style={{ color: theme.palette.customColors.mainText, fontSize: '16px', lineHeight: '17.6px' }} href='#'>
            Timeline
          </Link>
        </Typography>
      </Popover>
    </>
  )
}

export default Reports