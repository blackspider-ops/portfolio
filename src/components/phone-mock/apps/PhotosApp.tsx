'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getProxiedImageUrl } from '@/lib/image-proxy';

interface PhotosAppProps {
  onClose: () => void;
}

interface Photo {
  id: string;
  url: string;
  title: string;
}

export function PhotosApp({ onClose }: PhotosAppProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const supabase = createClient();
        
        // Get project covers as photos
        const { data: projects } = await supabase
          .from('projects')
          .select('id, title, cover_url')
          .eq('status', 'published')
          .not('cover_url', 'is', null)
          .limit(12);

        const { data: posts } = await supabase
          .from('blog_posts')
          .select('id, title, cover_url')
          .eq('status', 'published')
          .not('cover_url', 'is', null)
          .limit(6);

        const allPhotos: Photo[] = [
          ...(projects || []).map(p => ({
            id: `project-${p.id}`,
            url: p.cover_url!,
            title: p.title,
          })),
          ...(posts || []).map(p => ({
            id: `post-${p.id}`,
            url: p.cover_url!,
            title: p.title,
          })),
        ];

        setPhotos(allPhotos);
      } catch (err) {
        console.error('Error fetching photos:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPhotos();
  }, []);

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <button onClick={onClose} className="text-blue-400 text-sm">
          ← Back
        </button>
        <h1 className="text-white font-semibold">Photos</h1>
        <button className="text-blue-400 text-sm">Select</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {['Library', 'For You', 'Albums'].map((tab, i) => (
          <button
            key={tab}
            className={`flex-1 py-3 text-sm font-medium ${
              i === 0 ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {photos.map((photo, index) => (
              <motion.button
                key={photo.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-square overflow-hidden"
              >
                <img
                  src={getProxiedImageUrl(photo.url) || ''}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-white/50 text-center">No photos yet</p>
            <p className="text-white/30 text-sm text-center mt-1">
              Project and blog covers will appear here
            </p>
          </div>
        )}
      </div>

      {/* Photo viewer */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black z-50 flex flex-col"
          >
            <div className="px-4 py-3 flex items-center justify-between mt-12">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-blue-400 text-sm"
              >
                ← Back
              </button>
              <button className="text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={getProxiedImageUrl(selectedPhoto.url) || ''}
                alt={selectedPhoto.title}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
            <div className="p-4 text-center">
              <p className="text-white font-medium">{selectedPhoto.title}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
