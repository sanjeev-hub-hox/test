/* eslint-disable @typescript-eslint/no-unused-vars */
// ** React Imports
import { ReactNode } from 'react'

// ** Next Import
import Link from 'next/link'
import { useRouter } from 'next/router'

// ** MUI Components
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box, { BoxProps } from '@mui/material/Box'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import FooterIllustrations from 'src/views/pages/misc/FooterIllustrations'

// ** Styled Components
const BoxWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    width: '90vw'
  }
}))

const Img = styled('img')(({ theme }) => ({
  marginTop: theme.spacing(15),
  marginBottom: theme.spacing(15),
  [theme.breakpoints.down('lg')]: {
    height: 450,
    marginTop: theme.spacing(10),
    marginBottom: theme.spacing(10)
  },
  [theme.breakpoints.down('md')]: {
    height: 400
  }
}))

const Error503 = () => {
  const router = useRouter()

  const handleRetry = () => {
    window.location.assign('/')
  }

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <Box className='content-center'>
      <Box
        sx={{
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 2
        }}
      >
        <BoxWrapper>
          <Typography variant='h1' sx={{ mb: 2.5 }}>
            503
          </Typography>

          <Typography
            variant='h5'
            sx={{ mb: 2.5, letterSpacing: '0.18px', fontSize: '1.5rem !important' }}
          >
            Site is under maintenance 🚧
          </Typography>

          <Typography variant='body2'>
            We're working hard to fix the issue. Please check back later.
          </Typography>
        </BoxWrapper>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {/* <Button variant='contained' sx={{ px: 4 }} onClick={handleRetry}>
            Try again
          </Button>
          <Button variant='outlined' sx={{ px: 4 }} onClick={handleGoBack}>
            Go back
          </Button> */}
          <Button href='/' component={Link} variant='contained' sx={{ px: 3 }}>
            Back to Home
          </Button>
        </Box>
      </Box>

      <FooterIllustrations image='/images/pages/misc-404-object.png' />
    </Box>
  )
}

// ** Layout
Error503.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>

export default Error503