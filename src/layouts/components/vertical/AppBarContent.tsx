// ** MUI Imports

import Box from '@mui/material/Box'

// ** Icon Imports

import Image from 'next/image'
import Logo from '../../../../public/images/logo_new.png'
import { usePathname } from 'next/navigation'

// ** Type Import
import { Settings } from 'src/@core/context/settingsContext'

// ** Components

import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import { IconButton } from '@mui/material'
import UserIcon from '../UserIcon'
import Breadcrumb from '../breadcrumbs/Breadcrumb'

interface Props {
  hidden: boolean
  settings: Settings
  toggleNavVisibility: () => void
  saveSettings: (values: Settings) => void
}

const AppBarContent = (props: Props) => {
  // ** Props
  const { hidden, settings, toggleNavVisibility } = props

  const pathName = usePathname()

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className='actions-left' sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        {hidden ? (
          <IconButton disableFocusRipple disableRipple color='inherit' sx={{ ml: -2.75 }} onClick={toggleNavVisibility}>
            <UserIcon icon='mdi:menu' />
          </IconButton>
        ) : null}
        <Box sx={{ cursor: 'pointer' }}>
          <Image
            onClick={() => {
              window.open(process.env.NEXT_PUBLIC_FRONT_ACADEMICS_URL, '_self')
            }}
            alt='Logo'
            src={Logo}
            width={56}
            height={56}
          />
        </Box>
        {/* <ModeToggler settings={settings} saveSettings={saveSettings} /> */}
        <Box sx={{ marginLeft: '80px' }}>
          <Breadcrumb currentPath={pathName} />
        </Box>
      </Box>

      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        {/* <ShortcutsDropdown settings={settings} shortcuts={shortcuts} /> */}
        {/* <NotificationDropdown settings={settings} notifications={notifications} /> */}
        {/* <Requisition settings={settings} shortcuts={shortcuts} />
        <Attendance settings={settings} shortcuts={shortcuts} />
        <Logout settings={settings} shortcuts={shortcuts} />
        <Help settings={settings} shortcuts={shortcuts} />
        <KnowledgeBase settings={settings} shortcuts={shortcuts} /> */}
        <UserDropdown settings={settings} />
      </Box>
    </Box>
  )
}

export default AppBarContent
