import React, { useState, useRef } from 'react';
import {
  Video,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Play,
  ExternalLink,
  UploadCloud,
  FileVideo,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Check,
  X,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { LandingCmsConfig, VideoItem } from '../../../../types/landingCms';

interface VideoMediaTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
  onOpenMediaPicker?: (targetField: string) => void;
}

const PRESET_EXTENSION_VIDEOS: Array<{
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  duration: string;
}> = [
  {
    title: 'African Swine Fever (ASF) Farm Biosecurity Standard Protocols',
    description: 'Official Department of Agriculture video guide on boot baths, perimeter fencing, feed quarantine, and vehicle misting.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80',
    category: 'Biosecurity Protocol',
    duration: '6:45',
  },
  {
    title: 'Step-by-Step Piglet Ear-Tagging & Digital Profiling',
    description: 'Demonstration by SLSU veterinary researchers and Municipal Agriculturists on painless applicator usage and QR registration.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=800&q=80',
    category: 'Registry Training',
    duration: '4:20',
  },
  {
    title: 'Hinunangan Boundary Checkpoint Disinfection Operations',
    description: 'On-ground documentary showing continuous tire spraying and livestock transit permit inspections at municipal borders.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
    category: 'Field Operations',
    duration: '5:10',
  },
  {
    title: 'Swine Nutrition, Clean Feeding & Backyard Piggery Management',
    description: 'Cost-efficient alternative feeds and strict no-swill feeding rules to safeguard local hog populations from viral transmission.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
    category: 'Nutrition & Care',
    duration: '8:15',
  },
];

export const VideoMediaTab: React.FC<VideoMediaTabProps> = ({
  config,
  onChange,
  onOpenMediaPicker,
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeImportTab, setActiveImportTab] = useState<'upload' | 'youtube' | 'catalog' | 'media'>('youtube');

  // Add form states
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newThumb, setNewThumb] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Livestock Extension');
  const [newDuration, setNewDuration] = useState('5:00');

  // Import form states
  const [importYoutubeUrl, setImportYoutubeUrl] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importDesc, setImportDesc] = useState('');
  const [importCategory, setImportCategory] = useState('Livestock Extension');
  const [importDuration, setImportDuration] = useState('4:30');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const videos = config.videos || [];

  const extractYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = url.match(regExp);
    return match && match[1] ? match[1] : null;
  };

  const handleToggleVisible = (id: string) => {
    const updated = videos.map(v => (v.id === id ? { ...v, visible: !v.visible } : v));
    onChange({ videos: updated });
  };

  const handleDelete = (id: string) => {
    onChange({ videos: videos.filter(v => v.id !== id) });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= videos.length) return;
    const next = [...videos];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    onChange({ videos: next });
  };

  const handleUpdate = (id: string, updates: Partial<VideoItem>) => {
    const updated = videos.map(v => (v.id === id ? { ...v, ...updates } : v));
    onChange({ videos: updated });
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let thumb = newThumb.trim();
    if (!thumb) {
      const ytId = extractYoutubeVideoId(newUrl.trim());
      if (ytId) {
        thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      } else {
        thumb = 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1000&q=80';
      }
    }

    const item: VideoItem = {
      id: 'vid-' + Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      videoUrl: newUrl.trim(),
      thumbnailUrl: thumb,
      category: newCategory.trim() || 'Livestock Extension',
      duration: newDuration.trim() || '5:00',
      visible: true,
      order: videos.length + 1,
    };

    onChange({ videos: [...videos, item] });
    setNewTitle('');
    setNewUrl('');
    setNewThumb('');
    setNewDesc('');
    setShowAddForm(false);
  };

  // Import from local file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const reader = new FileReader();

    reader.onload = () => {
      const resultUrl = reader.result as string;
      const newVideo: VideoItem = {
        id: 'vid-file-' + Date.now(),
        title: fileNameClean,
        description: `Imported video file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
        videoUrl: resultUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80',
        category: 'Uploaded Video',
        duration: '3:00',
        visible: true,
        order: videos.length + 1,
      };

      onChange({ videos: [...videos, newVideo] });
      setIsUploading(false);
      setUploadSuccessMsg(`Successfully imported "${file.name}"!`);
      setTimeout(() => {
        setUploadSuccessMsg('');
        setShowImportModal(false);
      }, 1500);
    };

    reader.onerror = () => {
      setIsUploading(false);
      alert('Could not read video file. Please try a different file format.');
    };

    reader.readAsDataURL(file);
  };

  // Import from YouTube URL
  const handleImportYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importYoutubeUrl.trim()) return;

    const ytId = extractYoutubeVideoId(importYoutubeUrl.trim());
    const thumb = ytId
      ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
      : 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80';

    const title = importTitle.trim() || (ytId ? `YouTube Extension Video (${ytId})` : 'Imported YouTube Video');

    const newVideo: VideoItem = {
      id: 'vid-yt-' + Date.now(),
      title,
      description: importDesc.trim() || 'Educational video stream for Hinunangan livestock raisers.',
      videoUrl: importYoutubeUrl.trim(),
      thumbnailUrl: thumb,
      category: importCategory.trim() || 'YouTube Extension',
      duration: importDuration.trim() || '5:00',
      visible: true,
      order: videos.length + 1,
    };

    onChange({ videos: [...videos, newVideo] });
    setImportYoutubeUrl('');
    setImportTitle('');
    setImportDesc('');
    setShowImportModal(false);
  };

  // Import from catalog item
  const handleImportPreset = (preset: typeof PRESET_EXTENSION_VIDEOS[0]) => {
    const newVideo: VideoItem = {
      id: 'vid-preset-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      title: preset.title,
      description: preset.description,
      videoUrl: preset.videoUrl,
      thumbnailUrl: preset.thumbnailUrl,
      category: preset.category,
      duration: preset.duration,
      visible: true,
      order: videos.length + 1,
    };
    onChange({ videos: [...videos, newVideo] });
    setShowImportModal(false);
  };

  // Auto fill thumbnail from YouTube URL in add form
  const handleAutoFillThumb = () => {
    const ytId = extractYoutubeVideoId(newUrl);
    if (ytId) {
      setNewThumb(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);
    } else {
      alert('Please enter a valid YouTube URL first to auto-generate thumbnail.');
    }
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Headlines & Section Toggles */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm">Educational Video Section Headlines</h3>
          </div>
          <span className="text-[11px] text-stone-400 font-mono">
            {videos.length} Videos Loaded
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Section Title</label>
            <input
              type="text"
              value={config.videosTitle || config.videoTitle || 'Educational & Extension Videos'}
              onChange={e => onChange({ videosTitle: e.target.value, videoTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Section Subtitle</label>
            <input
              type="text"
              value={config.videosSubtitle || config.videoSubtitle || 'Field protocols, biosafety standards, and instructional material.'}
              onChange={e => onChange({ videosSubtitle: e.target.value, videoSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Videos Management Container */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100 flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Educational & Extension Videos</h3>
            <p className="text-[11px] text-stone-500">
              Manage video tutorials, demonstrations, and online learning clips shown on the landing page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Import Video Button */}
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-700" />
              <span>Import Video</span>
            </button>

            {/* Add Video Button */}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Close Form' : 'Add Video'}</span>
            </button>
          </div>
        </div>

        {/* Inline Add Video Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddVideo}
            className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                Add New Educational Video
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[11px] text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-emerald-900 mb-1 text-[11px]">
                  Video Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Free Ear-Tagging & Health Profiling"
                  className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 bg-white font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1 text-[11px]">
                  Video Stream / YouTube URL <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 bg-white font-mono text-[11px] focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAutoFillThumb}
                    title="Auto-fetch YouTube Thumbnail"
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-semibold text-[10px] shrink-0 cursor-pointer"
                  >
                    Auto Thumb
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-emerald-900 mb-1 text-[11px]">
                  Thumbnail Image URL
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newThumb}
                    onChange={e => setNewThumb(e.target.value)}
                    placeholder="https://... (or leave empty for auto)"
                    className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 bg-white font-mono text-[11px] focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  {onOpenMediaPicker && (
                    <button
                      type="button"
                      onClick={() => onOpenMediaPicker('videoThumbnail')}
                      title="Select from Media Library"
                      className="p-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 shrink-0 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1 text-[11px]">
                  Category / Badge
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="e.g. Biosecurity, Field Operations"
                  className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1 text-[11px]">
                  Estimated Duration
                </label>
                <input
                  type="text"
                  value={newDuration}
                  onChange={e => setNewDuration(e.target.value)}
                  placeholder="e.g. 5:20"
                  className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-emerald-900 mb-1 text-[11px]">
                Video Description / Learning Summary
              </label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Key takeaways, target raiser audience, or protocols explained in this video..."
                className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish Video to Landing Page</span>
              </button>
            </div>
          </form>
        )}

        {/* Existing Videos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos.map((video, idx) => (
            <div
              key={video.id}
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition ${
                video.visible ? 'bg-stone-50 border-stone-200 shadow-2xs' : 'bg-stone-100/60 border-stone-200 opacity-60'
              }`}
            >
              <div className="relative aspect-video bg-stone-900 flex items-center justify-center group">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <Play className="w-6 h-6 fill-white" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover:bg-black/50 transition">
                  <div className="w-10 h-10 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                {video.duration && (
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono font-bold">
                    {video.duration}
                  </span>
                )}

                {video.category && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 text-[10px] font-bold">
                    {video.category}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleVisible(video.id)}
                  title={video.visible ? 'Hide from landing page' : 'Show on landing page'}
                  className={`absolute top-2 right-2 p-1.5 rounded-lg text-white backdrop-blur-xs transition cursor-pointer ${
                    video.visible ? 'bg-black/60 hover:bg-black/80 text-emerald-300' : 'bg-stone-700/80 hover:bg-stone-800 text-stone-400'
                  }`}
                >
                  {video.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-stone-400 font-bold">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        title="Move Up"
                        className="p-1 rounded-md border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === videos.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        title="Move Down"
                        className="p-1 rounded-md border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(video.id)}
                        title="Delete Video"
                        className="p-1 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={video.title}
                    onChange={e => handleUpdate(video.id, { title: e.target.value })}
                    className="w-full px-2.5 py-1 rounded-lg border border-stone-300 bg-white font-bold text-xs"
                  />
                  <textarea
                    rows={2}
                    value={video.description}
                    onChange={e => handleUpdate(video.id, { description: e.target.value })}
                    className="w-full px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-[11px] leading-relaxed"
                  />
                </div>

                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2">
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>Watch Stream</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleToggleVisible(video.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      video.visible ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {video.visible ? 'Active' : 'Hidden'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {videos.length === 0 && (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 space-y-3">
            <Video className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="font-bold text-stone-700 text-xs">No educational videos uploaded yet</p>
            <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
              Use "Import Video" to upload a local file, paste a YouTube link, or import extension videos from our catalog.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs cursor-pointer hover:bg-emerald-100"
              >
                Import Video
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs cursor-pointer hover:bg-emerald-600"
              >
                + Add Video
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Video Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Import Video to Landing Page</h3>
                  <p className="text-[11px] text-stone-500">
                    Import from YouTube, device storage, official DA extension catalog, or media library
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Import Tabs */}
            <div className="flex border-b border-stone-200 px-5 pt-3 gap-2 bg-stone-50/50">
              <button
                type="button"
                onClick={() => setActiveImportTab('youtube')}
                className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeImportTab === 'youtube'
                    ? 'border-emerald-700 text-emerald-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Video className="w-3.5 h-3.5" /> YouTube Import
              </button>
              <button
                type="button"
                onClick={() => setActiveImportTab('upload')}
                className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeImportTab === 'upload'
                    ? 'border-emerald-700 text-emerald-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <FileVideo className="w-3.5 h-3.5" /> Upload File (MP4)
              </button>
              <button
                type="button"
                onClick={() => setActiveImportTab('catalog')}
                className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeImportTab === 'catalog'
                    ? 'border-emerald-700 text-emerald-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Official Presets (DA/SLSU)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Tab 1: YouTube Import */}
              {activeImportTab === 'youtube' && (
                <form onSubmit={handleImportYoutube} className="space-y-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      YouTube Video URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={importYoutubeUrl}
                      onChange={e => setImportYoutubeUrl(e.target.value)}
                      placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      The high-resolution thumbnail will be automatically retrieved from YouTube.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Video Title (optional)</label>
                      <input
                        type="text"
                        value={importTitle}
                        onChange={e => setImportTitle(e.target.value)}
                        placeholder="e.g. Backyard Piggery Biosecurity Standards"
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Category / Tag</label>
                      <input
                        type="text"
                        value={importCategory}
                        onChange={e => setImportCategory(e.target.value)}
                        placeholder="e.g. Veterinary Advisory"
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Video Summary Description</label>
                    <textarea
                      rows={2}
                      value={importDesc}
                      onChange={e => setImportDesc(e.target.value)}
                      placeholder="Brief overview of the video training contents..."
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Import YouTube Video</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Upload File */}
              {activeImportTab === 'upload' && (
                <div className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-center space-y-3 cursor-pointer transition"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                      <FileVideo className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                      <span className="font-bold text-emerald-950 text-sm block">
                        Click to Browse Video File
                      </span>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Supports MP4, WebM, MOV video formats from your local machine
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FileVideo className="w-3.5 h-3.5" />
                      <span>Select Video File</span>
                    </button>
                  </div>

                  {isUploading && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Reading and importing video file into registry system...</span>
                    </div>
                  )}

                  {uploadSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold">{uploadSuccessMsg}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Official Presets */}
              {activeImportTab === 'catalog' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-stone-500">
                    Select any pre-configured official Department of Agriculture and SLSU Extension instructional video to add directly to your public landing page:
                  </p>
                  <div className="space-y-2.5">
                    {PRESET_EXTENSION_VIDEOS.map((preset, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-emerald-50/60 hover:border-emerald-300 transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-16 h-10 rounded-lg overflow-hidden bg-stone-900 relative shrink-0">
                            <img
                              src={preset.thumbnailUrl}
                              alt={preset.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play className="w-3.5 h-3.5 fill-white text-white" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 text-xs block truncate">
                              {preset.title}
                            </span>
                            <span className="text-[10px] text-stone-500 block truncate">
                              {preset.description}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleImportPreset(preset)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Import</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
