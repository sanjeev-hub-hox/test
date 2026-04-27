import { getRequest, postRequest } from 'src/services/apiService'
import Announcements from '../SharedUIComponent/Announcements'
import { RemoteDialogOpener } from '../SharedUIComponent/ApprovalManagement/RemoteDialogOpener'
import NotificationDialog from '../SharedUIComponent/NotificationDialog'
import { FloatingSidebar } from 'ampersand-common-ui-helper'
import TaskDialog from '../Registration/Dialog/TaskDialog'

// import React, { useEffect, useState } from 'react'
// import { Box, Tooltip } from '@mui/material'
// import NotificationDialog from '../SharedUIComponent/NotificationDialog'
// import TaskDialog from '../Registration/Dialog/TaskDialog'
// import { Badge, IconButton } from '@mui/material'
// import { RemoteDialogOpener } from '../SharedUIComponent/ApprovalManagement/RemoteDialogOpener'
// import { getRequest, postRequest } from 'src/services/apiService'

// const FloatingSidebar = () => {
//   const [taskDialog, setTaskDialog] = useState(false)
//   const [notificationDialog, setNotificationDialog] = useState(false)
//   const [iSworkflowOpen, setIsWorkflowOpen] = useState(false)
//   const [unreadCount, setUnreadCount] = useState(0)
//   // const { userInfo } = useGlobalContext();
//   const [userInfo, setUserInfo] = useState<any>(() => {
//     const savedUserInfo = localStorage.getItem('userInfo')

//     return savedUserInfo ? JSON.parse(savedUserInfo) : {} // Default to {} if not found
//   })

//   useEffect(() => {
//     if (LoadUserDetails()) return

//     const intervalId = setInterval(() => {
//       if (LoadUserDetails()) {
//         clearInterval(intervalId)
//       }
//     }, 1000)

//     return () => clearInterval(intervalId)
//   }, [])

//   const LoadUserDetails = () => {
//     const savedUserInfo = localStorage.getItem('userInfo')
//     if (savedUserInfo) {
//       setUserInfo(JSON.parse(savedUserInfo))

//       return true // Return true if userInfo is found
//     }

//     return false // Return false if userInfo is not found
//   }

//   return (
//     <>
//       {/* <Box sx={{ cursor: 'pointer', mt: 3 }}>
//         <Tooltip title='Calendar'>
//           <span className='icon-calendar-1' onClick={() => setCalenderDialog(true)}></span>
//         </Tooltip>
//       </Box> */}
//       <Box sx={{ cursor: 'pointer', mt: 3 }}>
//         <Tooltip title='Tasks'>
//           <span className='icon-task-square' onClick={() => setTaskDialog(true)}></span>
//         </Tooltip>
//       </Box>
//       {/* <Box sx={{ cursor: 'pointer', mt: 3 }}>
//         <Tooltip title='Notifications'>
//           <span className='icon-notification' onClick={() => setNotificationDialog(true)}></span>
//         </Tooltip>
//       </Box>
//       <Box sx={{ cursor: 'pointer', mt: 3 }}>
//         <Tooltip title='Messages'>
//           <span className='icon-messages'></span>
//         </Tooltip>
//       </Box> */}
//       <Box sx={{ cursor: 'pointer', mt: 3 }}>
//         <Tooltip title='Notifications'>
//           <IconButton onClick={() => setNotificationDialog(true)}>
//             <Badge badgeContent={unreadCount} color='error'>
//               <span className='icon-notification'></span>
//             </Badge>
//           </IconButton>
//         </Tooltip>
//       </Box>
//       <Box sx={{ cursor: 'pointer', mt: 3 }}>
//         <Tooltip title='Workflow'>
//           <span
//             className='icon-element-4'
//             // onClick={() => router.push("/approval-workflow/")}
//             onClick={() => setIsWorkflowOpen(!iSworkflowOpen)}
//           ></span>
//         </Tooltip>
//       </Box>
//       {iSworkflowOpen && userInfo?.userInfo?.id ? (
//         <RemoteDialogOpener
//           userInfoData={userInfo}
//           openDialog={iSworkflowOpen}
//           handleClose={() => setIsWorkflowOpen(false)}
//           api={{
//             get: (p: any) => getRequest(p),
//             post: (p: any) => postRequest(p)
//           }}
//           ENV_VARIABLES={{
//             ADMIN_URL: process.env.NEXT_PUBLIC_FRONT_ADMIN_URL,
//             ACADEMICS_URL: process.env.NEXT_PUBLIC_FRONT_ACADEMICS_URL,
//             MARKETING_URL: process.env.NEXT_PUBLIC_FRONT_MARKETING_URL,
//             FINANCE_URL: process.env.NEXT_PUBLIC_FRONT_FINANCE_URL,
//             TRANSPORT_URL: process.env.NEXT_PUBLIC_FRONT_TRANSPORT_URL
//           }}
//         />
//       ) : (
//         // <DialogOpener
//         //   userInfoData={userInfo}
//         //   openDialog={iSworkflowOpen}
//         //   handleClose={() => setIsWorkflowOpen(false)}
//         // />
//         ''
//       )}

//       {userInfo?.userInfo?.id ? (
//         <NotificationDialog
//           userId={userInfo?.userInfo?.id}
//           userType={1}
//           handleClose={() => setNotificationDialog(!notificationDialog)}
//           openDrawer={notificationDialog}
//           title='Notification'
//           setUnreadCount={setUnreadCount}
//         />
//       ) : (
//         ''
//       )}
//       {taskDialog && (
//         <TaskDialog
//           openDrawer={taskDialog}
//           handleClose={() => {
//             setTaskDialog(false)
//           }}
//           title='My Tasks'
//         />
//       )}
//     </>
//   )
// }

// export default FloatingSidebar

const Sidebar = () => {

  return (
    <FloatingSidebar
      api={{ get: getRequest, post: postRequest }}
      envVariables={{
        ADMIN_URL: process.env.NEXT_PUBLIC_FRONT_ADMIN_URL,
        ACADEMICS_URL: process.env.NEXT_PUBLIC_FRONT_ACADEMICS_URL,
        MARKETING_URL: process.env.NEXT_PUBLIC_FRONT_MARKETING_URL,
        FINANCE_URL: process.env.NEXT_PUBLIC_FRONT_FINANCE_URL,
        TRANSPORT_URL: process.env.NEXT_PUBLIC_FRONT_TRANSPORT_URL,
      }}
      // eslint-disable-next-line no-console
      onUnreadCount={count => console.log('unread:', count)}
      renderTask={({ open, onClose }) => (   // ← add this
        <TaskDialog
          openDrawer={open}
          handleClose={onClose}
          title='My Tasks'
        />
      )}
      renderNotification={({ open, onClose, userId, userType, setUnreadCount }) => (
        <NotificationDialog
          openDrawer={open}
          handleClose={onClose}
          userId={Number(userId)}
          userType={userType}
          title='Notification'
          setUnreadCount={setUnreadCount}
        />
      )}
      renderAnnouncements={({ open, onClose, userId, userType }) => (
        <Announcements
          openDrawer={open}
          handleClose={onClose}
          userId={Number(userId)}
          userType={userType}
          title='Announcement'
        />
      )}
      renderWorkflow={({ open, onClose, userInfo, api, envVariables }) => (
        <RemoteDialogOpener
          openDialog={open}
          handleClose={onClose}
          userInfoData={userInfo}
          api={api}
          ENV_VARIABLES={envVariables}
        />
      )}
    />
  )
}

export default Sidebar

