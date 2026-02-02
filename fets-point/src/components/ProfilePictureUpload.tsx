import React, { useState } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null
  staffId: string
  staffName: string
  onAvatarUpdate: (newAvatarUrl: string | null) => void
  size?: 'sm' | 'md' | 'lg'
}

export function ProfilePictureUpload({
  currentAvatarUrl,
  staffId,
  staffName,
  onAvatarUpdate,
  size = 'md'
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  }

  const getAvatarUrl = () => {
    if (previewUrl) return previewUrl
    if (currentAvatarUrl) return currentAvatarUrl
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(staffName)}&background=3B82F6&color=FFFFFF&size=128`
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB')
      return
    }

    setUploading(true)
    try {
      // Create preview
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${staffId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Try multiple buckets for upload
      const bucketsToTry = ['profile-pictures', 'avatars', 'public', 'attachments']
      let successBucket = ''
      let publicUrl = ''

      for (const bucketName of bucketsToTry) {
        console.log(`📸 Trying to upload profile picture to bucket: ${bucketName}`)
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          })

        if (!uploadError) {
          successBucket = bucketName
          const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
          publicUrl = data.publicUrl
          console.log(`✅ Upload successful to bucket: ${bucketName}`)
          break
        } else {
          console.log(`❌ Bucket ${bucketName} failed:`, uploadError.message)
        }
      }

      if (!successBucket || !publicUrl) {
        throw new Error('All storage buckets failed. Please ensure a storage bucket exists in Supabase.')
      }

      // Update staff profile
      const { error: updateError } = await supabase
        .from('staff_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', staffId)

      if (updateError) {
        console.error('❌ Profile update failed:', updateError)
        throw updateError
      }

      onAvatarUpdate(publicUrl)
      setPreviewUrl(null) // Clear preview since we have real URL now
      toast.success('Profile picture updated successfully')
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || 'Failed to upload profile picture')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setUploading(true)
    try {
      // If there's a current avatar URL, try to delete it from storage
      if (currentAvatarUrl && currentAvatarUrl.includes('profile-pictures')) {
        const urlParts = currentAvatarUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const filePath = `avatars/${fileName}`

        // Delete from storage (don't throw error if file doesn't exist)
        await supabase.storage
          .from('profile-pictures')
          .remove([filePath])
      }

      // Update staff profile to remove avatar
      const { error } = await supabase
        .from('staff_profiles')
        .update({ avatar_url: null })
        .eq('id', staffId)

      if (error) throw error

      onAvatarUpdate(null)
      setPreviewUrl(null)
      toast.success('Profile picture removed')
    } catch (error: any) {
      console.error('Error removing avatar:', error)
      toast.error('Failed to remove profile picture')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative group">
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 relative`}>
        <img
          src={getAvatarUrl()}
          alt={`${staffName}'s profile`}
          className="w-full h-full object-cover"
        />

        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
        <div className="flex space-x-1">
          <label className="p-1.5 bg-white rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
            <Camera className="w-3 h-3 text-gray-600" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>

          {(currentAvatarUrl || previewUrl) && (
            <button
              onClick={handleRemoveAvatar}
              disabled={uploading}
              className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-3 h-3 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}