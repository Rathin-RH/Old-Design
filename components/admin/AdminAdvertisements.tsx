'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Video, 
  Plus, 
  Trash2, 
  Edit2, 
  Eye, 
  EyeOff,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { useKioskStore } from '@/lib/store';
import { AdvertisementService } from '@/lib/advertisementService';
import { Advertisement } from '@/lib/types';

const KIOSK_ID = process.env.NEXT_PUBLIC_KIOSK_ID || 'KIOSK_001';

export default function AdminAdvertisements() {
  const { kioskSettings, setKioskSettings } = useKioskStore();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(5);
  const [type, setType] = useState<'image' | 'video'>('image');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [link, setLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const ads = kioskSettings?.advertisements || [];

  const resetForm = () => {
    setTitle('');
    setDuration(5);
    setType('image');
    setMediaFile(null);
    setMediaUrl('');
    setLink('');
    setIsAddingNew(false);
    setEditingAd(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (type === 'image' && !file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (type === 'video' && !file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }
      
      setMediaFile(file);
      setMediaUrl(URL.createObjectURL(file));
    }
  };

  const handleAddAdvertisement = async () => {
    if (!title || (!mediaFile && !mediaUrl)) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsUploading(true);
    try {
      let finalMediaUrl = mediaUrl;

      // Upload file if provided
      if (mediaFile) {
        finalMediaUrl = await AdvertisementService.uploadMedia(KIOSK_ID, mediaFile, type);
        toast.success('Media uploaded successfully');
      }

      const newAd: Omit<Advertisement, 'id' | 'createdAt'> = {
        title,
        duration,
        type,
        [type === 'image' ? 'imageUrl' : 'videoUrl']: finalMediaUrl,
        ...(link ? { link } : {}), // Only include link if it has a value
        isActive: true,
      } as Omit<Advertisement, 'id' | 'createdAt'>;

      await AdvertisementService.addAdvertisement(KIOSK_ID, newAd);
      toast.success('Advertisement added successfully');
      
      // Refresh kiosk settings
      const settings = await import('@/lib/kioskService').then(m => 
        m.KioskService.getKioskSettings(KIOSK_ID)
      );
      if (settings) {
        setKioskSettings(settings);
      }

      resetForm();
    } catch (error) {
      console.error('Error adding advertisement:', error);
      toast.error('Failed to add advertisement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      await AdvertisementService.updateAdvertisement(KIOSK_ID, ad.id, {
        isActive: !ad.isActive,
      });
      
      // Refresh
      const settings = await import('@/lib/kioskService').then(m => 
        m.KioskService.getKioskSettings(KIOSK_ID)
      );
      if (settings) {
        setKioskSettings(settings);
      }
      
      toast.success(`Advertisement ${ad.isActive ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('Error toggling ad:', error);
      toast.error('Failed to update advertisement');
    }
  };

  const handleDeleteAd = async (ad: Advertisement) => {
    if (!confirm(`Delete "${ad.title}"?`)) return;

    try {
      await AdvertisementService.deleteAdvertisement(KIOSK_ID, ad);
      toast.success('Advertisement deleted');
      
      // Refresh
      const settings = await import('@/lib/kioskService').then(m => 
        m.KioskService.getKioskSettings(KIOSK_ID)
      );
      if (settings) {
        setKioskSettings(settings);
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Failed to delete advertisement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Advertisement Management</h3>
        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      {/* Add New Form */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-6 overflow-hidden"
          >
            <h4 className="font-bold text-gray-800 mb-4">Add New Advertisement</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Advertisement Title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'image' | 'video')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    min="1"
                    max="60"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    accept={type === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileSelect}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload {type} or drag and drop
                    </p>
                    {mediaFile && (
                      <p className="text-sm text-primary-600 mt-2 font-medium">
                        {mediaFile.name}
                      </p>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link (Optional)
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {mediaUrl && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  {type === 'image' ? (
                    <img src={mediaUrl} alt="Preview" className="max-h-48 mx-auto rounded" />
                  ) : (
                    <video src={mediaUrl} controls className="max-h-48 mx-auto rounded" />
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAddAdvertisement}
                  disabled={isUploading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium px-4 py-3 rounded-lg transition-colors"
                >
                  {isUploading ? 'Uploading...' : 'Add Advertisement'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advertisements List */}
      <div className="space-y-4">
        {ads.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No advertisements yet</p>
            <p className="text-sm text-gray-500">Click "Add New" to create your first ad</p>
          </div>
        ) : (
          ads.map((ad, index) => (
            <motion.div
              key={ad.id || `ad-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white border-2 rounded-xl p-4 ${
                ad.isActive ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="flex-shrink-0 w-32 h-20 bg-gray-100 rounded-lg overflow-hidden">
                  {ad.type === 'image' && ad.imageUrl ? (
                    <img 
                      src={ad.imageUrl} 
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  ) : ad.type === 'video' && ad.videoUrl ? (
                    <video 
                      src={ad.videoUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {ad.type === 'image' ? (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      ) : (
                        <Video className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-gray-800">{ad.title}</h5>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="capitalize">{ad.type}</span>
                        <span>•</span>
                        <span>{ad.duration}s duration</span>
                        {ad.displayCount !== undefined && (
                          <>
                            <span>•</span>
                            <span>{ad.displayCount} views</span>
                          </>
                        )}
                      </div>
                      {ad.link && (
                        <p className="text-xs text-blue-600 mt-1 truncate max-w-xs">
                          🔗 {String(ad.link)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(ad)}
                        className={`p-2 rounded-lg transition-colors ${
                          ad.isActive
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={ad.isActive ? 'Disable' : 'Enable'}
                      >
                        {ad.isActive ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad)}
                        className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

