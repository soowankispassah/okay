'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { CameraIcon, SpinnerIcon } from '@/components/icons';

// Add this function at the top of the file, before the component
async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension
        const MAX_DIMENSION = 1200;
        if (width > height && width > MAX_DIMENSION) {
          height = (height * MAX_DIMENSION) / width;
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = (width * MAX_DIMENSION) / height;
          height = MAX_DIMENSION;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Start with high quality
        let quality = 0.9;
        let compressedFile: File;

        function compressWithQuality() {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas to Blob failed'));
                return;
              }

              compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              // If size is still too large and quality can be reduced
              if (compressedFile.size > maxSizeMB * 1024 * 1024 && quality > 0.1) {
                quality -= 0.1;
                compressWithQuality();
              } else {
                resolve(compressedFile);
              }
            },
            'image/jpeg',
            quality
          );
        }

        compressWithQuality();
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isNameLoading, setIsNameLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Separate messages for each section
  const [nameMessage, setNameMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [imageMessage, setImageMessage] = useState('');
  const [imageError, setImageError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  
  const [name, setName] = useState(session?.user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const emailTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch latest user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/get-profile');
        const data = await response.json();
        if (data.user) {
          setName(data.user.name || '');
          setUserImage(data.user.image);
          if (!previewImage) {
            setPreviewImage(data.user.image);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [previewImage]);

  // Handle image change
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Invalid file type. Only JPEG, PNG and WebP are allowed.');
      return;
    }

    // Validate initial file size (max 5MB for initial upload)
    const MAX_UPLOAD_SIZE = 5;
    if (file.size > MAX_UPLOAD_SIZE * 1024 * 1024) {
      setImageError(`File size too large. Maximum size is ${MAX_UPLOAD_SIZE}MB.`);
      return;
    }

    try {
      // Show loading state while compressing
      setIsImageLoading(true);
      setImageMessage('');
      setImageError('');

      // Compress image to max 1MB
      const compressedFile = await compressImage(file, 1);
      setProfileImage(compressedFile);

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setIsImageLoading(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      setImageError('Error processing image. Please try again.');
      setIsImageLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!profileImage) return;

    setIsImageLoading(true);
    setImageMessage('');
    setImageError('');

    try {
      const formData = new FormData();
      formData.append('image', profileImage);

      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Update the session with new image
      await update({
        ...session,
        user: {
          ...session?.user,
          image: data.user.image
        }
      });
      
      setImageMessage('Profile image updated successfully');
      // Clear the file input
      const fileInput = document.getElementById('profile-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setProfileImage(null);
    } catch (err: any) {
      setImageError(err.message || 'Error updating profile image');
    } finally {
      setIsImageLoading(false);
    }
  };

  // Handle name update
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setNameError('Name cannot be empty');
      return;
    }

    setIsNameLoading(true);
    setNameMessage('');
    setNameError('');

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      await update({ name: data.user.name });
      setNameMessage('Name updated successfully');
    } catch (err: any) {
      setNameError(err.message || 'Error updating name');
    } finally {
      setIsNameLoading(false);
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsPasswordLoading(true);
    setPasswordMessage('');
    setPasswordError('');

    try {
      const response = await fetch('/api/user/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setPasswordMessage('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setIsDeleteLoading(true);
    setNameMessage('');
    setNameError('');

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Sign out and redirect to login page
      await signOut({ callbackUrl: '/auth/login?deleted=true' });
    } catch (err: any) {
      setNameError(err.message || 'Error deleting account');
      setIsDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleEmailClick = () => {
    // Clear any existing timeout
    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current);
    }
    
    setEmailMessage('Email address cannot be edited');
    
    // Set new timeout
    emailTimeoutRef.current = setTimeout(() => {
      setEmailMessage('');
    }, 3000);
  };

  return (
    <AppLayout>
      <div className="flex-1 bg-white dark:bg-[#212121] h-full">
        <div className="max-w-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 bg-white dark:bg-[#212121] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-4">
                {(previewImage || userImage) ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800 shadow-lg">
                    <Image
                      src={previewImage || userImage || ''}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      unoptimized={previewImage?.startsWith('data:')}
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-lg">
                    <span className="text-3xl text-gray-600 dark:text-gray-300">
                      {name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => document.getElementById('profile-image')?.click()}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 
                    dark:hover:text-white transition-colors duration-200"
                >
                  <CameraIcon className="w-4 h-4" />
                  Change Photo
                </button>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {profileImage && (
                  <button
                    onClick={handleImageUpload}
                    disabled={isImageLoading}
                    className="mt-2 px-4 py-2 text-sm font-medium text-white bg-black dark:bg-white 
                      dark:text-black rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black 
                      dark:focus:ring-white transition-colors duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImageLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <SpinnerIcon />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      'Save Photo'
                    )}
                  </button>
                )}
                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {profileImage ? profileImage.name : 'No file chosen'}
                </span>
                {imageMessage && (
                  <p className="text-sm text-green-600 dark:text-green-400">{imageMessage}</p>
                )}
                {imageError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{imageError}</p>
                )}
              </div>
            </div>

            {/* Name Update Section */}
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-gray-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-neutral-600 dark:focus:ring-neutral-600 disabled:opacity-75 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-600"
                />
              </div>
              {nameMessage && (
                <div className="px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200">
                  {nameMessage}
                </div>
              )}
              {nameError && (
                <div className="px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200">
                  {nameError}
                </div>
              )}
              <button
                onClick={handleUpdateName}
                disabled={isNameLoading}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-black dark:bg-white 
                  dark:text-black rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black 
                  dark:focus:ring-white transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNameLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <SpinnerIcon />
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Update Name'
                )}
              </button>
            </div>

            {/* Password Update Section */}
            <div className="space-y-6">
              {passwordMessage && (
                <div className="mb-6 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200">
                  {passwordMessage}
                </div>
              )}
              {passwordError && (
                <div className="mb-6 px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200">
                  {passwordError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    New Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600 dark:text-gray-400"
                    >
                      {showNewPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Confirm Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600 dark:text-gray-400"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={handleUpdatePassword}
                disabled={isPasswordLoading}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-black dark:bg-white 
                  dark:text-black rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black 
                  dark:focus:ring-white transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPasswordLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <SpinnerIcon />
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>

            {/* Delete Account Section */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="mt-2 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 
                    dark:hover:text-rose-300 transition-colors duration-200"
                >
                  Delete your account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#212121] rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Delete Account
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete your account? This action cannot be undone and will permanently delete your account and all associated data.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isDeleteLoading ? (
                  <>
                    <SpinnerIcon className="text-white" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
} 