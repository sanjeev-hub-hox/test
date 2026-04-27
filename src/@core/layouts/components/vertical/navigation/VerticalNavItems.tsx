// ** Type Imports
import { NavLink, NavGroup, LayoutProps, NavSectionTitle } from 'src/@core/layouts/types'

// ** Custom Menu Components
import VerticalNavLink from './VerticalNavLink'
import VerticalNavGroup from './VerticalNavGroup'
import VerticalNavSectionTitle from './VerticalNavSectionTitle'

interface Props {
  parent?: NavGroup
  navHover?: boolean
  navVisible?: boolean
  groupActive: string
  isSubToSub?: NavGroup
  currentActiveGroup: string[]
  navigationBorderWidth: number
  settings: LayoutProps['settings']
  saveSettings: LayoutProps['saveSettings']
  setGroupActive: (value: string) => void
  isOpen: boolean
  setIsOpen?: (value: boolean) => void
  setCurrentActiveGroup: (item: string[]) => void
  verticalNavItems?: LayoutProps['verticalLayoutProps']['navMenu']['navItems']
  permission?: string
}

const resolveNavItemComponent = (item: NavGroup | NavLink | NavSectionTitle) => {
  if ((item as NavSectionTitle).sectionTitle) return VerticalNavSectionTitle
  if ((item as NavGroup).children) return VerticalNavGroup

  return VerticalNavLink
}

const VerticalNavItems = (props: Props) => {
  const { verticalNavItems, setGroupActive, setIsOpen } = props

  const RenderMenuItems = verticalNavItems?.map((item: NavGroup | NavLink | NavSectionTitle, index: number) => {
    const TagName: any = resolveNavItemComponent(item)

    const handleHover = () => {
      const hasChildren = (item as NavGroup).children && (item as NavGroup).children!.length > 0

      if (hasChildren) {
        setGroupActive(item.title as string)
        setIsOpen && setIsOpen(true)
      } else {
        setGroupActive('')
        setIsOpen && setIsOpen(false)
      }
    }

    return (
      <div key={index} onMouseEnter={handleHover}>
        <TagName {...props} item={item} />
      </div>
    )
  })

  return <>{RenderMenuItems}</>
}

export default VerticalNavItems
