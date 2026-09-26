import React, { useState } from 'react';
import {
  Share2,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Check,
  X,
  Link as LinkIcon,
  Tag,
  Building,
} from 'lucide-react';
import { LandingCmsConfig, SocialPlatform, SocialPostItem } from '../../../../types/landingCms';

interface SocialMediaTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
  onOpenMediaPicker?: (targetField: string) => void;
}

export const SocialMediaTab: React.FC<SocialMediaTabProps> = ({ config, onChange }) => {
  // New Post Form State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostAuthor, setNewPostAuthor] = useState('Municipal Agriculture Office Hinunangan');
  const [newPostUrl, setNewPostUrl] = useState('https://facebook.com/LGUHinunanganOfficial');
  const [newPostPlatform, setNewPostPlatform] = useState<SocialPlatform>('facebook');
  const [newPostButtonText, setNewPostButtonText] = useState('View on Facebook');
  const [newPostButtonColor, setNewPostButtonColor] = useState<string>('blue');
  const [newPostButtonPlatform, setNewPostButtonPlatform] = useState<'facebook' | 'youtube' | 'portal' | 'website' | 'other'>('facebook');
  const [newPostNoticeLabel, setNewPostNoticeLabel] = useState('Official Municipal Notice');
  const [newPostDate, setNewPostDate] = useState('Just Now');

  // Edit Existing Post State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SocialPostItem | null>(null);

  const socials = config.socialAccounts || [];
  const posts = config.socialPosts || [];

  const handleToggleSocial = (platform: string) => {
    const updated = socials.map(s => (s.platform === platform ? { ...s, enabled: !s.enabled } : s));
    onChange({ socialAccounts: updated });
  };

  const handleUpdateSocialUrl = (platform: string, url: string) => {
    const updated = socials.map(s => (s.platform === platform ? { ...s, url } : s));
    onChange({ socialAccounts: updated });
  };

  const handleTogglePostVisible = (id: string) => {
    const updated = posts.map(p => (p.id === id ? { ...p, visible: !p.visible } : p));
    onChange({ socialPosts: updated });
  };

  const handleDeletePost = (id: string) => {
    if (editingPostId === id) {
      setEditingPostId(null);
      setEditForm(null);
    }
    onChange({ socialPosts: posts.filter(p => p.id !== id) });
  };

  const handleStartEdit = (post: SocialPostItem) => {
    const isYt = (post.buttonText || '').toLowerCase().includes('youtube') || post.postUrl.toLowerCase().includes('youtube');
    const isFb = !isYt && ((post.buttonText || '').toLowerCase().includes('facebook') || post.postUrl.toLowerCase().includes('facebook'));
    setEditingPostId(post.id);
    setEditForm({
      ...post,
      buttonText: post.buttonText || (isYt ? 'Watch on YouTube' : 'View on Facebook'),
      buttonColor: post.buttonColor || (isYt ? 'red' : isFb ? 'blue' : 'emerald'),
      buttonPlatform: post.buttonPlatform || (isYt ? 'youtube' : isFb ? 'facebook' : 'other'),
      noticeLabel: post.noticeLabel || 'Official Municipal Notice',
    });
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditForm(null);
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editForm || !editingPostId) return;
    if (!editForm.title.trim()) return;

    const updated = posts.map(p => {
      if (p.id === editingPostId) {
        return {
          ...p,
          title: editForm.title.trim(),
          content: editForm.content.trim(),
          author: editForm.author.trim() || 'Municipal Agriculture Office Hinunangan',
          postUrl: editForm.postUrl.trim() || '#',
          platform: editForm.platform || 'facebook',
          date: editForm.date.trim() || 'Recently Updated',
          buttonText: editForm.buttonText?.trim() || 'View on Facebook',
          buttonColor: editForm.buttonColor || 'blue',
          buttonPlatform: editForm.buttonPlatform || 'facebook',
          noticeLabel: editForm.noticeLabel?.trim() || 'Official Municipal Notice',
        };
      }
      return p;
    });

    onChange({ socialPosts: updated });
    setEditingPostId(null);
    setEditForm(null);
  };

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim()) return;
    const item: SocialPostItem = {
      id: 'sp-' + Date.now(),
      platform: newPostPlatform,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      author: newPostAuthor.trim() || 'Municipal Agriculture Office Hinunangan',
      date: newPostDate.trim() || 'Just Now',
      postUrl: newPostUrl.trim() || 'https://facebook.com/LGUHinunanganOfficial',
      buttonText: newPostButtonText.trim() || (newPostButtonColor === 'red' ? 'Watch on YouTube' : 'View on Facebook'),
      buttonColor: newPostButtonColor,
      buttonPlatform: newPostButtonPlatform,
      noticeLabel: newPostNoticeLabel.trim() || 'Official Municipal Notice',
      visible: true,
    };
    onChange({ socialPosts: [item, ...posts] });
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostButtonText('View on Facebook');
    setNewPostButtonColor('blue');
    setNewPostButtonPlatform('facebook');
    setNewPostNoticeLabel('Official Municipal Notice');
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Headlines */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Share2 className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Social Media Section Headlines</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Section Title</label>
            <input
              type="text"
              value={config.socialTitle}
              onChange={e => onChange({ socialTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Section Subtitle</label>
            <input
              type="text"
              value={config.socialSubtitle}
              onChange={e => onChange({ socialSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300"
            />
          </div>
        </div>
      </div>

      {/* Connected Channels & Accounts */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <h3 className="font-bold text-stone-900 text-sm">Official Social Media Profiles & Feeds</h3>
          <span className="text-[11px] text-stone-400">
            {socials.filter(s => s.enabled).length} of {socials.length} Enabled
          </span>
        </div>

        <div className="space-y-3">
          {socials.map(account => (
            <div
              key={account.platform}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                account.enabled ? 'bg-stone-50 border-stone-200' : 'bg-stone-100/60 border-stone-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 w-40 sm:w-48 shrink-0">
                <span className="font-bold text-stone-900 capitalize text-xs">
                  {account.platform}
                </span>
              </div>

              <input
                type="text"
                value={account.url}
                onChange={e => handleUpdateSocialUrl(account.platform, e.target.value)}
                placeholder={`https://${account.platform}.com/...`}
                className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-[11px]"
              />

              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={account.enabled}
                  onChange={() => handleToggleSocial(account.platform)}
                  className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span className="text-[11px] font-bold text-stone-700">
                  {account.enabled ? 'Active' : 'Off'}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Social Posts / Notices with Editable Button */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Featured Announcements & Social Posts</h3>
            <p className="text-[11px] text-stone-500">
              Customize post titles, excerpts, notice badges, and editable action buttons (e.g. &ldquo;View on Facebook&rdquo;).
            </p>
          </div>
          <span className="text-[11px] text-stone-400 font-bold bg-stone-100 px-2 py-0.5 rounded-md">
            {posts.length} Posts
          </span>
        </div>

        {/* Existing Posts List */}
        <div className="space-y-4">
          {posts.map(post => {
            const isEditing = editingPostId === post.id;

            if (isEditing && editForm) {
              return (
                <div
                  key={post.id}
                  className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 space-y-3.5 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b pb-2.5 border-emerald-200">
                    <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                      Edit Social Post &amp; Action Button
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono">ID: {post.id}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Post Title / Headline *</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white font-semibold text-stone-900 focus:ring-2 focus:ring-emerald-500"
                        placeholder="Advisory headline"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Action Button Text (Editable)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={editForm.buttonText || ''}
                          onChange={e => setEditForm({ ...editForm, buttonText: e.target.value })}
                          className={`w-full px-3 py-1.5 rounded-xl border font-bold pr-8 transition ${
                            editForm.buttonColor === 'red' || editForm.buttonPlatform === 'youtube'
                              ? 'border-red-300 bg-red-50/50 text-red-700 focus:ring-2 focus:ring-red-500'
                              : editForm.buttonColor === 'blue' || editForm.buttonPlatform === 'facebook'
                              ? 'border-blue-300 bg-blue-50/50 text-blue-800 focus:ring-2 focus:ring-blue-500'
                              : 'border-emerald-300 bg-emerald-50/50 text-emerald-900 focus:ring-2 focus:ring-emerald-500'
                          }`}
                          placeholder="e.g. View on Facebook, Watch on YouTube, Read Advisory..."
                        />
                        <ExternalLink className={`w-3.5 h-3.5 absolute right-2.5 top-2.5 pointer-events-none ${
                          editForm.buttonColor === 'red' || editForm.buttonPlatform === 'youtube' ? 'text-red-500' : editForm.buttonColor === 'blue' || editForm.buttonPlatform === 'facebook' ? 'text-blue-500' : 'text-emerald-600'
                        }`} />
                      </div>

                      {/* Action Button Color Preset Selection (facebook is blue, youtube is red and else) */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] font-bold text-stone-500 uppercase">Style:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm({
                              ...editForm,
                              buttonColor: 'blue',
                              buttonPlatform: 'facebook',
                              buttonText: editForm.buttonText === 'Watch on YouTube' ? 'View on Facebook' : (editForm.buttonText || 'View on Facebook'),
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                            editForm.buttonColor === 'blue' || editForm.buttonPlatform === 'facebook'
                              ? 'bg-[#1877F2] text-white border-[#1877F2] shadow-xs'
                              : 'bg-blue-50 text-[#1877F2] border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                          Facebook is Blue
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setEditForm({
                              ...editForm,
                              buttonColor: 'red',
                              buttonPlatform: 'youtube',
                              buttonText: editForm.buttonText === 'View on Facebook' ? 'Watch on YouTube' : (editForm.buttonText || 'Watch on YouTube'),
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                            editForm.buttonColor === 'red' || editForm.buttonPlatform === 'youtube'
                              ? 'bg-[#FF0000] text-white border-[#FF0000] shadow-xs'
                              : 'bg-red-50 text-[#FF0000] border-red-200 hover:bg-red-100'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                          YouTube is Red
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setEditForm({
                              ...editForm,
                              buttonColor: 'emerald',
                              buttonPlatform: 'other',
                              buttonText: (editForm.buttonText === 'View on Facebook' || editForm.buttonText === 'Watch on YouTube') ? 'Official Advisory' : (editForm.buttonText || 'Official Advisory'),
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                            editForm.buttonColor === 'emerald' || (editForm.buttonPlatform !== 'facebook' && editForm.buttonPlatform !== 'youtube')
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                          Else (Custom / Green)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Destination URL</label>
                      <input
                        type="text"
                        value={editForm.postUrl}
                        onChange={e => setEditForm({ ...editForm, postUrl: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white font-mono text-[11px]"
                        placeholder="https://facebook.com/..."
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Author / Office</label>
                      <input
                        type="text"
                        value={editForm.author}
                        onChange={e => setEditForm({ ...editForm, author: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white"
                        placeholder="MAO Extension Team"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Notice Badge Label</label>
                      <input
                        type="text"
                        value={editForm.noticeLabel || ''}
                        onChange={e => setEditForm({ ...editForm, noticeLabel: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-stone-700"
                        placeholder="e.g. Official Municipal Notice"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Post Content Excerpt / Advisory</label>
                    <textarea
                      rows={3}
                      value={editForm.content}
                      onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white leading-relaxed"
                      placeholder="Write advisory or summary..."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                        Button Preview: &ldquo;{editForm.buttonText || 'View on Facebook'}&rdquo;
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit()}
                        className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={post.id}
                className={`p-4 rounded-xl border space-y-2.5 transition ${
                  post.visible ? 'bg-stone-50 border-stone-200' : 'bg-stone-100/60 border-stone-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-stone-900">{post.title}</span>
                    <span className="text-[10px] text-stone-400 font-mono">({post.date})</span>
                    {post.buttonColor === 'red' || post.buttonPlatform === 'youtube' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        YouTube (Red): &ldquo;{post.buttonText || 'Watch on YouTube'}&rdquo;
                      </span>
                    ) : post.buttonColor === 'blue' || post.buttonPlatform === 'facebook' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Facebook (Blue): &ldquo;{post.buttonText || 'View on Facebook'}&rdquo;
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Else (Green): &ldquo;{post.buttonText || 'Official Link'}&rdquo;
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(post)}
                      className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-700 cursor-pointer transition"
                      title="Edit post & button text"
                      aria-label="Edit post"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePostVisible(post.id)}
                      className="p-1.5 rounded-md hover:bg-stone-200 text-stone-600 cursor-pointer transition"
                      title={post.visible ? 'Hide from landing page' : 'Show on landing page'}
                      aria-label="Toggle visibility"
                    >
                      {post.visible ? <Eye className="w-3.5 h-3.5 text-emerald-700" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 rounded-md hover:bg-red-100 text-red-600 cursor-pointer transition"
                      title="Delete post"
                      aria-label="Delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 leading-relaxed">{post.content}</p>

                <div className="flex items-center justify-between pt-2 text-[10px] text-stone-400 border-t border-stone-200/60">
                  <div className="flex items-center gap-2">
                    <span>By: {post.author}</span>
                    <span className="text-stone-300">&bull;</span>
                    <span className="text-stone-500 font-medium">
                      {post.noticeLabel || 'Official Municipal Notice'}
                    </span>
                  </div>
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-bold hover:underline flex items-center gap-1.5 px-2.5 py-1 rounded-lg shadow-2xs transition ${
                      post.buttonColor === 'red' || post.buttonPlatform === 'youtube'
                        ? 'bg-[#FF0000] text-white hover:bg-[#cc0000]'
                        : post.buttonColor === 'blue' || post.buttonPlatform === 'facebook'
                        ? 'bg-[#1877F2] text-white hover:bg-[#166fe5]'
                        : 'bg-emerald-700 text-white hover:bg-emerald-800'
                    }`}
                  >
                    <span>{post.buttonText || (post.buttonColor === 'red' ? 'Watch on YouTube' : 'View on Facebook')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Post Form */}
        <form onSubmit={handleAddPost} className="pt-5 border-t border-stone-200 space-y-3 bg-stone-50/70 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-700" /> Add Featured Social Post
            </span>
            <span className="text-[10px] text-stone-500">Live preview updates automatically</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Post Headline / Subject *</label>
              <input
                type="text"
                value={newPostTitle}
                onChange={e => setNewPostTitle(e.target.value)}
                placeholder="e.g. Free Swine Deworming Drive"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Action Button Text (Editable)
              </label>
              <input
                type="text"
                value={newPostButtonText}
                onChange={e => setNewPostButtonText(e.target.value)}
                placeholder="View on Facebook"
                className={`w-full px-3 py-1.5 rounded-xl border bg-white font-bold transition ${
                  newPostButtonColor === 'red' || newPostButtonPlatform === 'youtube'
                    ? 'border-red-300 text-red-700 focus:ring-2 focus:ring-red-500'
                    : newPostButtonColor === 'blue' || newPostButtonPlatform === 'facebook'
                    ? 'border-blue-300 text-blue-800 focus:ring-2 focus:ring-blue-500'
                    : 'border-emerald-300 text-emerald-800 focus:ring-2 focus:ring-emerald-500'
                }`}
              />

              {/* Color style presets for new post */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Style:</span>
                <button
                  type="button"
                  onClick={() => {
                    setNewPostButtonColor('blue');
                    setNewPostButtonPlatform('facebook');
                    if (!newPostButtonText || newPostButtonText === 'Watch on YouTube') {
                      setNewPostButtonText('View on Facebook');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                    newPostButtonColor === 'blue' && newPostButtonPlatform === 'facebook'
                      ? 'bg-[#1877F2] text-white border-[#1877F2] shadow-xs'
                      : 'bg-blue-50 text-[#1877F2] border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                  Facebook is Blue
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewPostButtonColor('red');
                    setNewPostButtonPlatform('youtube');
                    if (!newPostButtonText || newPostButtonText === 'View on Facebook') {
                      setNewPostButtonText('Watch on YouTube');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                    newPostButtonColor === 'red' && newPostButtonPlatform === 'youtube'
                      ? 'bg-[#FF0000] text-white border-[#FF0000] shadow-xs'
                      : 'bg-red-50 text-[#FF0000] border-red-200 hover:bg-red-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                  YouTube is Red
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewPostButtonColor('emerald');
                    setNewPostButtonPlatform('other');
                    if (!newPostButtonText || newPostButtonText === 'View on Facebook' || newPostButtonText === 'Watch on YouTube') {
                      setNewPostButtonText('Official Advisory');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                    newPostButtonColor === 'emerald' && newPostButtonPlatform === 'other'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                  Else (Custom / Green)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Post Destination URL</label>
              <input
                type="text"
                value={newPostUrl}
                onChange={e => setNewPostUrl(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 font-mono text-[11px] bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Author / Office</label>
              <input
                type="text"
                value={newPostAuthor}
                onChange={e => setNewPostAuthor(e.target.value)}
                placeholder="Municipal Agriculture Office"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Notice Label / Badge</label>
              <input
                type="text"
                value={newPostNoticeLabel}
                onChange={e => setNewPostNoticeLabel(e.target.value)}
                placeholder="Official Municipal Notice"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Post Summary / Advisory Excerpt</label>
            <textarea
              rows={2}
              value={newPostContent}
              onChange={e => setNewPostContent(e.target.value)}
              placeholder="Provide a short summary of the announcement for Hinunangan swine raisers and stakeholders..."
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-stone-500">
              Button will display as: <strong className="text-blue-700">&ldquo;{newPostButtonText || 'View on Facebook'}&rdquo;</strong>
            </span>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Post to Feed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

