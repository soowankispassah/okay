'use client';
import { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ProfileIcon, SettingsIcon, SunIcon, MoonIcon, LogoutIcon } from '@/components/icons'

export default function UserDropdown() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const { theme, setTheme } = useTheme()
  const [userImage, setUserImage] = useState(session?.user?.image)

  // Fetch latest user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/get-profile');
        const data = await response.json();
        if (data.user?.image) {
          setUserImage(data.user.image);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  if (!session?.user) return null

  const handleThemeChange = (e: React.MouseEvent) => {
    e.preventDefault()
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400">
        {userImage ? (
          <div className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-white dark:ring-neutral-800">
            <Image
              src={userImage}
              alt={session.user.email || ''}
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 ring-2 ring-white dark:ring-neutral-800">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {session.user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 dark:divide-neutral-800 rounded-lg bg-white dark:bg-[#212121] py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3">
            <p className="text-sm text-gray-900 dark:text-white truncate">
              {session.user.email}
            </p>
          </div>

          <div className="py-2">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => router.push('/profile')}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-neutral-800' : ''
                  } flex w-full items-center gap-2 px-4 py-3 mb-1 text-sm text-gray-700 dark:text-gray-200`}
                >
                  <ProfileIcon className="h-4 w-4" />
                  My Profile
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => router.push('/settings')}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-neutral-800' : ''
                  } flex w-full items-center gap-2 px-4 py-3 mb-1 text-sm text-gray-700 dark:text-gray-200`}
                >
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </button>
              )}
            </Menu.Item>
            <div className="border-t border-gray-100 dark:border-neutral-800 my-1"></div>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleThemeChange}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-neutral-800' : ''
                  } flex w-full items-center gap-2 px-4 py-3 mb-1 text-sm text-gray-700 dark:text-gray-200`}
                >
                  {theme === 'light' ? (
                    <MoonIcon className="h-4 w-4" />
                  ) : (
                    <SunIcon className="h-4 w-4" />
                  )}
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => signOut()}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-neutral-800' : ''
                  } flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200`}
                >
                  <LogoutIcon className="h-4 w-4" />
                  Log Out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
