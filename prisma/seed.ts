import { MenuType, Prisma, PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'
import { promisify } from 'node:util'

const SUPER_ADMIN_USERNAME = 'pure-admin'
const SUPER_ADMIN_PASSWORD = '123456'
const SUPER_ADMIN_EMAIL = 'admin@pure-admin.com'
const SUPER_ADMIN_NICKNAME = 'admin'
const SUPER_ADMIN_PHONE = '13333333333'

const scryptAsync = promisify(crypto.scrypt)

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

const prisma = new PrismaClient()

async function main() {
  // 可以将不需要创建的内容注释掉

  // 创建超级管理员账号
  await createSuperAdmin()

  // 创建首页菜单数据
  await createHomeMenu()
  // 创建组件示例菜单数据
  await createExampleMenu()
  // 创建异常页菜单数据
  await createExceptionMenu()
  // 创建多级菜单数据
  await createMultiMenu()
  // 创建系统菜单数据
  await createSystemMenu()
  // 创建关于菜单数据
  await createAboutMenu()
}

async function createSuperAdmin() {
  const password = await hashPassword(SUPER_ADMIN_PASSWORD)

  const newUser: Prisma.UserCreateInput = {
    username: SUPER_ADMIN_USERNAME,
    password,
    email: SUPER_ADMIN_EMAIL,
    nickName: SUPER_ADMIN_NICKNAME,
    phone: SUPER_ADMIN_PHONE,
    isSuperAdmin: true,
  }

  await prisma.user.create({
    data: newUser,
  })
}

async function createHomeMenu() {
  await prisma.menu.create({
    data: {
      title: '首页',
      type: MenuType.MENU,
      icon: 'icon-park-outline:computer',
      code: 'home:read',
      path: '/',
      i18nKey: 'menu.home',
      sort: 0,
      isShow: true,
      description: '系统首页',
    },
  })
}

async function createExceptionMenu() {
  const exception = await prisma.menu.create({
    data: {
      title: '异常页',
      type: MenuType.DIRECTORY,
      icon: 'icon-park-outline:abnormal',
      i18nKey: 'menu.exception',
      sort: 3,
      isShow: true,
      description: '异常页',
    },
  })

  await prisma.menu.createMany({
    data: [
      {
        parentId: exception.id,
        title: '403',
        type: MenuType.MENU,
        icon: 'icon-park-outline:termination-file',
        path: '/exception/403',
        i18nKey: 'menu.exception403',
        sort: 0,
        isShow: true,
      },
      {
        parentId: exception.id,
        title: '404',
        type: MenuType.MENU,
        icon: 'icon-park-outline:file-search-one',
        path: '/exception/404',
        i18nKey: 'menu.exception404',
        sort: 1,
        isShow: true,
      },
      {
        parentId: exception.id,
        title: '500',
        type: MenuType.MENU,
        icon: 'icon-park-outline:file-failed-one',
        path: '/exception/500',
        i18nKey: 'menu.exception500',
        sort: 2,
        isShow: true,
      },
    ],
  })
}

async function createMultiMenu() {
  const multiMenu = await prisma.menu.create({
    data: {
      title: '多级菜单',
      type: MenuType.DIRECTORY,
      icon: 'icon-park-outline:hamburger-button',
      i18nKey: 'menu.multiMenu',
      isShow: true,
      sort: 4,
    },
  })

  await prisma.menu.create({
    data: {
      parentId: multiMenu.id,
      title: '菜单1',
      type: MenuType.MENU,
      icon: 'icon-park-outline:hamburger-button',
      path: '/multi-menu/first-child',
      i18nKey: 'menu.multiMenu1',
      isShow: true,
      sort: 0,
    },
  })

  const menu2 = await prisma.menu.create({
    data: {
      parentId: multiMenu.id,
      title: '菜单2',
      type: MenuType.DIRECTORY,
      icon: 'icon-park-outline:hamburger-button',
      i18nKey: 'menu.multiMenu2',
      isShow: true,
      sort: 1,
    },
  })

  await prisma.menu.create({
    data: {
      parentId: menu2.id,
      title: '菜单2-1',
      type: MenuType.MENU,
      icon: 'icon-park-outline:hamburger-button',
      path: '/multi-menu/second-child',
      i18nKey: 'menu.multiMenu2_1',
      isShow: true,
      sort: 0,
    },
  })

  const menu2_2 = await prisma.menu.create({
    data: {
      parentId: menu2.id,
      title: '菜单2-2',
      type: MenuType.DIRECTORY,
      icon: 'icon-park-outline:hamburger-button',
      i18nKey: 'menu.multiMenu2_2',
      isShow: true,
      sort: 1,
    },
  })

  await prisma.menu.create({
    data: {
      parentId: menu2_2.id,
      title: '菜单2-2-1',
      type: MenuType.MENU,
      icon: 'icon-park-outline:hamburger-button',
      path: '/multi-menu/third-child',
      i18nKey: 'menu.multiMenu2_2_1',
      isShow: true,
      sort: 0,
    },
  })
}

async function createSystemMenu() {
  // 创建根菜单：系统设置
  const systemSettings = await prisma.menu.create({
    data: {
      title: '系统设置',
      type: MenuType.DIRECTORY,
      icon: 'icon-park-outline:config',
      i18nKey: 'menu.system',
      sort: 5,
      isShow: true,
      description: '系统设置',
    },
  })

  // 创建子菜单：用户管理
  const userManagement = await prisma.menu.create({
    data: {
      parentId: systemSettings.id,
      title: '用户管理',
      type: MenuType.MENU,
      icon: 'icon-park-outline:user',
      code: 'system:user:read',
      path: '/system/user',
      i18nKey: 'menu.systemUser',
      sort: 0,
      isShow: true,
    },
  })

  // 创建用户管理菜单的功能权限
  await prisma.menu.createMany({
    data: [
      {
        parentId: userManagement.id,
        title: '新增用户',
        type: MenuType.FEATURE,
        code: 'system:user:create',
      },
      {
        parentId: userManagement.id,
        title: '编辑用户',
        type: MenuType.FEATURE,
        code: 'system:user:update',
      },
      {
        parentId: userManagement.id,
        title: '删除用户',
        type: MenuType.FEATURE,
        code: 'system:user:delete',
      },
    ],
  })

  // 创建子菜单：角色管理
  const roleManagement = await prisma.menu.create({
    data: {
      parentId: systemSettings.id,
      title: '角色管理',
      type: MenuType.MENU,
      icon: 'icon-park-outline:every-user',
      code: 'system:role:read',
      path: '/system/role',
      i18nKey: 'menu.systemRole',
      sort: 1,
      isShow: true,
    },
  })

  // 创建角色管理菜单的功能权限
  await prisma.menu.createMany({
    data: [
      {
        parentId: roleManagement.id,
        title: '新增角色',
        type: MenuType.FEATURE,
        code: 'system:role:create',
      },
      {
        parentId: roleManagement.id,
        title: '编辑角色',
        type: MenuType.FEATURE,
        code: 'system:role:update',
      },
      {
        parentId: roleManagement.id,
        title: '删除角色',
        type: MenuType.FEATURE,
        code: 'system:role:delete',
      },
    ],
  })

  // 创建子菜单：菜单管理
  const menuManagement = await prisma.menu.create({
    data: {
      parentId: systemSettings.id,
      title: '菜单管理',
      type: MenuType.MENU,
      icon: 'icon-park-outline:hamburger-button',
      code: 'system:menu:read',
      path: '/system/menu',
      i18nKey: 'menu.systemMenu',
      sort: 2,
      isShow: true,
    },
  })

  // 创建菜单管理菜单的功能权限
  await prisma.menu.createMany({
    data: [
      {
        parentId: menuManagement.id,
        title: '新增菜单',
        type: MenuType.FEATURE,
        code: 'system:menu:create',
      },
      {
        parentId: menuManagement.id,
        title: '编辑菜单',
        type: MenuType.FEATURE,
        code: 'system:menu:update',
      },
      {
        parentId: menuManagement.id,
        title: '删除菜单',
        type: MenuType.FEATURE,
        code: 'system:menu:delete',
      },
    ],
  })

  // 创建子菜单：API管理
  const apiManagement = await prisma.menu.create({
    data: {
      parentId: systemSettings.id,
      title: 'API管理',
      type: MenuType.MENU,
      icon: 'icon-park-outline:api',
      code: 'system:api:read',
      path: '/system/api',
      i18nKey: 'menu.systemApi',
      sort: 3,
      isShow: true,
    },
  })

  // 创建API管理菜单的功能权限
  await prisma.menu.createMany({
    data: [
      {
        parentId: apiManagement.id,
        title: '新增API',
        type: MenuType.FEATURE,
        code: 'system:api:create',
      },
      {
        parentId: apiManagement.id,
        title: '编辑API',
        type: MenuType.FEATURE,
        code: 'system:api:update',
      },
      {
        parentId: apiManagement.id,
        title: '删除API',
        type: MenuType.FEATURE,
        code: 'system:api:delete',
      },
    ],
  })
}

async function createExampleMenu() {
  // 创建根菜单：组件示例
  const example = await prisma.menu.create({
    data: {
      title: '组件示例',
      type: MenuType.DIRECTORY,
      icon: 'icon-park-outline:components',
      i18nKey: 'menu.example',
      sort: 2,
      isShow: true,
    },
  })

  await prisma.menu.createMany({
    data: [
      {
        parentId: example.id,
        title: '数据表格',
        type: MenuType.MENU,
        icon: 'icon-park-outline:table',
        path: '/example/data-table',
        i18nKey: 'menu.dataTableExample',
        sort: 0,
        isShow: true,
      },
      {
        parentId: example.id,
        title: '表格高度自适应',
        type: MenuType.MENU,
        icon: 'icon-park-outline:auto-height-one',
        path: '/example/table-auto-height',
        i18nKey: 'menu.tableAutoHeightExample',
        sort: 1,
        isShow: true,
      },
      {
        parentId: example.id,
        title: '跨页面数据传输',
        type: MenuType.MENU,
        icon: 'icon-park-outline:transfer-data',
        path: '/example/page-transfer',
        i18nKey: 'menu.pageTransferExample',
        sort: 2,
        isShow: true,
      },
      {
        parentId: example.id,
        title: '图表',
        type: MenuType.MENU,
        icon: 'icon-park-outline:chart-histogram-two',
        path: '/example/chart',
        i18nKey: 'menu.chartExample',
        sort: 3,
        isShow: true,
      },
      {
        parentId: example.id,
        title: '图标',
        type: MenuType.MENU,
        icon: 'icon-park-outline:bydesign',
        path: '/example/icon',
        i18nKey: 'menu.iconExample',
        sort: 4,
        isShow: true,
      },
      {
        parentId: example.id,
        title: '数字滚动',
        type: MenuType.MENU,
        icon: 'icon-park-outline:data-screen',
        path: '/example/count-to',
        i18nKey: 'menu.countToExample',
        sort: 5,
        isShow: true,
      },
      {
        parentId: example.id,
        title: '剪切板',
        type: MenuType.MENU,
        icon: 'icon-park-outline:copy',
        path: '/example/clipboard',
        i18nKey: 'menu.clipboardExample',
        sort: 6,
        isShow: true,
      },
      {
        parentId: example.id,
        title: '富文本编辑器',
        type: MenuType.MENU,
        icon: 'icon-park-outline:editor',
        path: '/example/rich-text',
        i18nKey: 'menu.richTextExample',
        sort: 7,
        isShow: true,
      },
      {
        parentId: example.id,
        title: '主题切换动画',
        type: MenuType.MENU,
        icon: 'icon-park-outline:switch-themes',
        path: '/example/theme-switch',
        i18nKey: 'menu.themeSwitchExample',
        sort: 8,
        isShow: true,
      },
    ],
  })
}

async function createAboutMenu() {
  await prisma.menu.create({
    data: {
      title: '关于',
      type: MenuType.MENU,
      icon: 'icon-park-outline:info',
      path: '/about',
      i18nKey: 'menu.about',
      sort: 99,
      isShow: true,
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
