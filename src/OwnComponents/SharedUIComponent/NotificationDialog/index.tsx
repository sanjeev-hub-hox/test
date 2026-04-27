import React, { useEffect, useRef, useState } from 'react'
import { Box, IconButton, Typography, Drawer, Divider, Skeleton, Button } from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'
import { Tabs, Tab } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { patchRequest, postRequest } from 'src/services/apiService'
import moment from 'moment'

//Style for custom tab

//Custom style for tab 2
const CustomTabs = styled(Tabs)({
  backgroundColor: '#fff'
})

const CustomTab = styled((props: any) => <Tab {...props} />)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 100,
  marginRight: '20px',
  fontSize: '14px',
  fontWeight: 400,
  lineHeight: '15.4px',
  color: `${theme.palette.customColors.mainText}`,
  '&:hover': {
    boxShadow: 'none',
    borderRadius: '0px'
  },
  '&.Mui-selected': {
    backgroundColor: `${theme.palette.customColors.chipHoverBackground}`,
    color: `${theme.palette.customColors.sliderMainColor}`,
    fontWeight: 500
  }
}))

//Custom Style for tab 2 section content
interface StyledBoxProps {
  active: boolean
}

const StyledBox = styled(Box)<StyledBoxProps>(({ theme, active }) => ({
  '& .MuiButtonBase-root.MuiIconButton-root': {
    fontSize: '14px',
    fontWeight: active ? 500 : 400,
    lineHeight: '15.4px',
    textTransform: 'capitalize',
    color: active ? '#313030' : theme.palette.customColors.mainText,

    '& span': {
      color: active ? '#3635C9' : theme.palette.customColors.mainText
    }
  },
  '& .MuiTypography-root.MuiTypography-subtitle2': {
    fontSize: '14px',
    fontWeight: active ? 500 : 400,
    lineHeight: '15.4px',
    textTransform: 'capitalize',
    color: active ? '#313030' : theme.palette.customColors.mainText,
    marginTop: '5px',
    display: 'flex',
    alignItems: 'center',
    '& span': {
      color: active ? '#3635C9' : theme.palette.customColors.mainText,
      fontSize: '14px !important'
    }
  },
  '& .MuiTypography-root.MuiTypography-body2': {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '17.4px',
    textTransform: 'capitalize',
    color: active ? '#313030' : theme.palette.customColors.mainText,
    marginTop: '5px'
  },
  '& .MuiTypography-root.MuiTypography-caption': {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '13.2px',
    textTransform: 'capitalize',
    color: theme.palette.customColors.mainText
  }
}))

type SchoolTour = {
  openDrawer: boolean
  handleClose?: () => void
  title?: string
  userType?: number
  userId?: number
  setUnreadCount?: React.Dispatch<React.SetStateAction<number>>
}

interface ContentItem {
  _id: string
  title: string
  body: string
  timestamp: string
  active: boolean
  isRead: boolean
}

const NotificationDialog = ({ openDrawer, handleClose, title, userId, setUnreadCount }: SchoolTour) => {
  const theme = useTheme()
  const [totalPages, setTotalPages] = useState(0)
  const [value, setValue] = useState('unread')
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0)
  const [expanded, setExpanded] = useState<boolean[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false) // Loading state
  const [visibleItems, setVisibleItems] = useState<ContentItem[]>([]) // For lazy loading
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [isLoadingOnScroll, setIsLoadingOnScroll] = useState<boolean>(false) // Loading state
  const [pageSize] = useState(10)
  const [pageNumber, setPageNumber] = useState(1)

  const handleTabTwoChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  const fetchData = (page = 1, limit: number = pageSize) => {
    setIsLoading(true)
    const payload: any = {
      userId: userId,
      pageNumber: page,
      pageSize: limit
    }
    if (value === 'read') payload['read'] = true
    else if (value === 'unread') payload['read'] = false
    postRequest({
      url: '/list-request-notification',
      data: payload,
      serviceURL: 'communication'
    })
      .then(res => {
        const data = res?.data?.data?.list
        setTotalPages(res.data?.data?.meta?.totalPages)
        if (setUnreadCount) setUnreadCount(res.data?.data?.meta?.unread ?? 0)
        // Check if data exists and has valid entries
        if (data && Array.isArray(data) && data.length > 0) {
          setVisibleItems(
            data?.map((item: any) => ({
              _id: item._id,
              title: item.title || 'No Title',
              body: item.content || 'No Content',
              timestamp: `${moment.utc(item?.createdAt).local().fromNow().replace(/^in /, '')}`,
              active: false,
              isRead: item?.isRead
            }))
          )
        } else {
          // If no data is received, clear visibleItems
          setVisibleItems([])
        }
      })
      .catch(() => {
        setVisibleItems([])
      })
      .finally(() => {
        setIsLoading(false)
        setIsLoadingOnScroll(false)
      })
  }

  const markAsRead = (id: string) => {
    setIsLoading(true)
    patchRequest({
      url: '/request-notification-read',
      data: {
        notificationId: id
      },
      serviceURL: 'communication'
    })
  }

  useEffect(() => {
    setVisibleItems([])
    fetchData(1, pageSize)
  }, [value, openDrawer])

  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth)
    }

    window.addEventListener('resize', updateScreenWidth)

    return () => {
      window.removeEventListener('resize', updateScreenWidth)
    }
  }, [])

  const handleExpandClick = (index: number) => {
    setExpanded(prevState => {
      const newState = [...prevState]
      newState[index] = !newState[index]

      return newState
    })
  }

  const truncateText = (text: string, isExpanded: boolean | undefined) => {
    if (isExpanded || text?.length <= 50) return text

    return `${text?.substring(0, 50)}...`
  }

  const handlePagination = (page: number) => {
    setPageNumber(page)
    fetchData(page)
  }

  return (
    <div>
      {openDrawer && (
        <Drawer
          anchor='right'
          open={openDrawer}
          onClose={handleClose}
          sx={{
            '& .MuiDrawer-paper': {
              width: '500px',
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '0px',
              zIndex: 1500,
              paddingTop: '16px',
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingBottom: '0px',
              overflow: `hidden`,
              boxShadow: '0px 2px 10px 0px #4C4E6438'
            }
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              zIndex: 1500,
              width: '100%',
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant='subtitle1' color={'text.primary'} sx={{ lineHeight: '24px' }}>
              {title}
            </Typography>
            <IconButton disableFocusRipple disableRipple onClick={handleClose}>
              <span className='icon-close-circle'></span>
            </IconButton>
          </Box>
          <Box>
            <Box>
              <Box sx={{ mt: 3 }}>
                <CustomTabs value={value} onChange={handleTabTwoChange}>
                  <CustomTab label={`Unread `} value='unread' />
                  <CustomTab label={`Read  `} value='read' />
                  <CustomTab label={`All  `} value='all' />
                </CustomTabs>
              </Box>
              <Box
                className='fixedModal'
                ref={scrollContainerRef}
                sx={
                  screenWidth >= 2500
                    ? { height: '1110px', overflowY: 'auto' }
                    : screenWidth >= 1900
                    ? { height: '850px', overflowY: 'auto' }
                    : screenWidth >= 1600
                    ? { height: '600px', overflowY: 'auto' }
                    : screenWidth >= 1400
                    ? { height: '570px', overflowY: 'auto' }
                    : screenWidth >= 1300
                    ? { height: '430px', overflowY: 'auto' }
                    : { height: '400px', overflowY: 'auto' }
                }
              >
                {value === 'unread' && (
                  <>
                    {visibleItems.map((content, index) => (
                      <>
                        <StyledBox
                          active={content.active}
                          sx={{
                            mt: 4,
                            mb: 4,
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center'
                          }}
                          onClick={() => content._id && markAsRead(content._id)}
                        >
                          <Box sx={{ mr: 3 }}>
                            <IconButton
                              sx={{
                                width: '56px',
                                height: '56px',
                                backgroundColor: theme.palette.customColors.stepDefault,
                                color: 'text.primary'
                              }}
                            >
                              {content.active ? (
                                <span className='icon-info'></span>
                              ) : (
                                <span className='icon-alarm'></span>
                              )}
                            </IconButton>
                          </Box>
                          <Box>
                            <Typography variant='subtitle2'>
                              <span
                                className='icon-tagright'
                                style={{
                                  marginRight: '10px',
                                  fontSize: '14px !important',
                                  color: content.active ? '#3F41D1' : '#666'
                                }}
                              ></span>{' '}
                              {content.title}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                              }}
                            >
                              <Typography variant='body2'>{truncateText(content.body, expanded[index])}</Typography>
                              <span
                                className={expanded[index] ? 'icon-arrow-up-2' : 'icon-arrow-down-1'}
                                onClick={() => handleExpandClick(index)}
                                style={{ marginLeft: 0, cursor: 'pointer' }}
                              ></span>
                            </Box>
                            <Typography variant='caption'>{content.timestamp}</Typography>
                          </Box>
                        </StyledBox>
                        {index !== visibleItems.length - 1 && <Divider sx={{ borderColor: '#e6e6e6' }} />}
                      </>
                    ))}
                    {!visibleItems?.length || isLoadingOnScroll ? (
                      <Box
                        sx={{
                          minHeight: '30%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-around'
                        }}
                      >
                        {isLoadingOnScroll || isLoading ? 'Loading...' : 'All Caught up!!'}
                      </Box>
                    ) : (
                      ''
                    )}
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, index) => (
                        <Box
                          key={`skeleton-${index}`}
                          sx={{
                            mt: 4,
                            mb: 4,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Skeleton variant='circular' width={56} height={56} animation='pulse' sx={{ mr: 3 }} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant='text' width='60%' animation='wave' />
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start'
                              }}
                            >
                              <Skeleton variant='text' width='95%' animation='wave' />
                              <Skeleton variant='text' width='5%' animation='wave' />
                            </Box>
                            <Skeleton variant='text' width='60%' animation='wave' />
                          </Box>
                        </Box>
                      ))}
                  </>
                )}
                {value === 'read' && (
                  <>
                    {visibleItems.map((content, index) => (
                      <>
                        <StyledBox
                          active={content.active}
                          sx={{
                            mt: 4,
                            mb: 4,
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center'
                          }}
                        >
                          <Box sx={{ mr: 3 }}>
                            <IconButton
                              sx={{
                                width: '56px',
                                height: '56px',
                                backgroundColor: theme.palette.customColors.stepDefault,
                                color: 'text.primary'
                              }}
                            >
                              {content.active ? (
                                <span className='icon-info'></span>
                              ) : (
                                <span className='icon-alarm'></span>
                              )}
                            </IconButton>
                          </Box>
                          <Box>
                            <Typography variant='subtitle2'>
                              <span
                                className='icon-tagright'
                                style={{
                                  marginRight: '10px'
                                }}
                              ></span>{' '}
                              {content.title}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                              }}
                            >
                              <Typography variant='body2'>{truncateText(content.body, expanded[index])}</Typography>
                              <span
                                className={expanded[index] ? 'icon-arrow-up-2' : 'icon-arrow-down-1'}
                                onClick={() => handleExpandClick(index)}
                                style={{ marginLeft: 0, cursor: 'pointer' }}
                              ></span>
                            </Box>
                            <Typography variant='caption'>{content.timestamp}</Typography>
                          </Box>
                        </StyledBox>
                        {index !== visibleItems.length - 1 && <Divider sx={{ borderColor: '#e6e6e6' }} />}
                      </>
                    ))}
                    {!visibleItems?.length || isLoadingOnScroll ? (
                      <Box
                        sx={{
                          minHeight: '30%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-around'
                        }}
                      >
                        {isLoadingOnScroll ? 'Loading...' : 'All Caught up!!'}
                      </Box>
                    ) : (
                      ''
                    )}
                  </>
                )}
                {value === 'all' && (
                  <>
                    {visibleItems.map((content, index) => (
                      <>
                        <StyledBox
                          active={content.active}
                          sx={{
                            mt: 4,
                            mb: 4,
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center'
                          }}
                          onClick={() => content._id && !content.isRead && markAsRead(content._id)}
                        >
                          <Box sx={{ mr: 3 }}>
                            <IconButton
                              sx={{
                                width: '56px',
                                height: '56px',
                                backgroundColor: theme.palette.customColors.stepDefault,
                                color: 'text.primary'
                              }}
                            >
                              {content.active ? (
                                <span className='icon-info'></span>
                              ) : (
                                <span className='icon-alarm'></span>
                              )}
                            </IconButton>
                          </Box>
                          <Box>
                            <Typography variant='subtitle2'>
                              <span
                                className='icon-tagright'
                                style={{
                                  marginRight: '10px'
                                }}
                              ></span>{' '}
                              {content.title}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                              }}
                            >
                              <Typography variant='body2'>{truncateText(content.body, expanded[index])}</Typography>
                              <span
                                className={expanded[index] ? 'icon-arrow-up-2' : 'icon-arrow-down-1'}
                                onClick={() => handleExpandClick(index)}
                                style={{ marginLeft: 0, cursor: 'pointer' }}
                              ></span>
                            </Box>
                            <Typography variant='caption'>{content.timestamp}</Typography>
                          </Box>
                        </StyledBox>
                        {index !== visibleItems.length - 1 && <Divider sx={{ borderColor: '#e6e6e6' }} />}
                      </>
                    ))}
                    {!visibleItems?.length || isLoadingOnScroll ? (
                      <Box
                        sx={{
                          minHeight: '30%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-around'
                        }}
                      >
                        {isLoadingOnScroll || isLoading ? 'Loading...' : 'All Caught up!!'}
                      </Box>
                    ) : (
                      ''
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Box>
          {visibleItems?.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', paddingBottom: 0 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, gap: 5 }}
              >
                <p>Total Pages: {totalPages}</p>
                <p>Current Page: {pageNumber}</p>
              </Box>
              <Button onClick={() => handlePagination(pageNumber - 1)} disabled={pageNumber <= 1}>
                <ArrowBackIcon />
              </Button>
              <Button onClick={() => handlePagination(pageNumber + 1)} disabled={pageNumber >= totalPages}>
                <ArrowForwardIcon />
              </Button>
            </Box>
          )}
        </Drawer>
      )}
    </div>
  )
}

export default NotificationDialog
