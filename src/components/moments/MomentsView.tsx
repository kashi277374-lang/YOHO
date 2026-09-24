import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PostMoment } from '../../types';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Trash2, 
  Image, 
  Send, 
  Sparkles, 
  X, 
  UserPlus, 
  Check,
  Tag
} from 'lucide-react';

export const MomentsView: React.FC = () => {
  const { 
    currentUser, 
    posts, 
    createPost, 
    likePost, 
    addComment, 
    deletePost, 
    followUser 
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newTags, setNewTags] = useState('StarLive, Community');
  const [selectedPostComments, setSelectedPostComments] = useState<PostMoment | null>(null);
  const [commentText, setCommentText] = useState('');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
    await createPost(newContent.trim(), newMediaUrl || undefined, tagsArray);
    setNewContent('');
    setNewMediaUrl('');
    setShowCreateModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewMediaUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedPostComments) return;
    addComment(selectedPostComments.id, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="pb-24 pt-2 px-3.5 max-w-2xl mx-auto">
      
      {/* Top Bar for Moments */}
      <div className="flex items-center justify-between mb-4 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <img src={currentUser.avatar} alt="Me" className="w-10 h-10 rounded-full object-cover border border-emerald-400" />
          <p className="text-xs text-slate-400">Share your thoughts or photos with the community...</p>
        </div>
        <button
          id="create-moment-btn"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Sparkles size={14} />
          <span>Post</span>
        </button>
      </div>

      {/* Posts Stream */}
      <div className="space-y-4">
        {posts.map((post) => {
          const isLiked = post.likedBy?.includes(currentUser.id);
          const isAuthor = post.authorId === currentUser.id;
          const isAdmin = currentUser.role === 'admin';

          return (
            <div 
              key={post.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md"
            >
              {/* Post Author Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={post.authorAvatar} 
                    alt={post.authorName} 
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{post.authorName}</span>
                      <span>{post.countryFlag}</span>
                      {post.authorLevel && (
                        <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1 rounded font-bold">
                          Lv.{post.authorLevel}
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-400">{post.createdAt}</span>
                  </div>
                </div>

                {/* Delete if owner or admin */}
                {(isAuthor || isAdmin) && (
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Post Content */}
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-3 whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.map((tag, idx) => (
                    <span key={idx} className="text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Media Image */}
              {post.mediaUrl && (
                <div className="rounded-xl overflow-hidden mb-3 max-h-96 bg-black/40 border border-slate-800">
                  <img 
                    src={post.mediaUrl} 
                    alt="Moment Media" 
                    className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-300"
                  />
                </div>
              )}

              {/* Actions Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <button
                  onClick={() => likePost(post.id)}
                  className={`flex items-center gap-1.5 p-1 rounded-lg transition-colors ${
                    isLiked ? 'text-rose-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  <Heart size={16} className={isLiked ? 'fill-rose-400' : ''} />
                  <span>{post.likesCount}</span>
                </button>

                <button
                  onClick={() => setSelectedPostComments(post)}
                  className="flex items-center gap-1.5 p-1 rounded-lg hover:text-white transition-colors"
                >
                  <MessageCircle size={16} />
                  <span>{post.commentsCount || post.comments?.length || 0} Comments</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText?.(window.location.href);
                    setCopiedPostId(post.id);
                    setTimeout(() => setCopiedPostId(null), 2000);
                  }}
                  className="flex items-center gap-1.5 p-1 rounded-lg hover:text-white transition-colors"
                >
                  <Share2 size={16} />
                  <span className={copiedPostId === post.id ? 'text-emerald-400 font-bold' : ''}>
                    {copiedPostId === post.id ? 'Copied link!' : 'Share'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}

        {posts.length === 0 && (
          <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800">
            <Sparkles size={28} className="mx-auto text-emerald-400 mb-2 opacity-80" />
            <p className="text-slate-200 font-bold text-sm">No Moments Shared Yet</p>
            <p className="text-slate-400 text-xs mt-1">Share photos, thoughts, and updates with the community!</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-full text-xs shadow-md active:scale-95 transition-transform"
            >
              Post First Moment
            </button>
          </div>
        )}
      </div>

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-400" />
              Create New Moment
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <textarea
                rows={4}
                required
                placeholder="What's happening in your StarLive life today?"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
              />

              {/* Photo Upload & Preview */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Upload Photo (Click or Drag & Drop)
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30"
                  />
                </div>
                {newMediaUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden max-h-40 w-full border border-slate-700">
                    <img src={newMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewMediaUrl('')}
                      className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tags (comma separated)
                </label>
                <input 
                  type="text"
                  placeholder="PKBattle, Singing, Chill"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg"
              >
                Publish Moment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* COMMENTS MODAL */}
      {selectedPostComments && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-4 max-w-md mx-auto w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Comments</h3>
              <button 
                onClick={() => setSelectedPostComments(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {selectedPostComments.comments && selectedPostComments.comments.length > 0 ? (
                selectedPostComments.comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-800/50">
                    <img src={c.authorAvatar} alt={c.authorName} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{c.authorName}</span>
                        <span className="text-[10px] text-slate-400">{c.createdAt}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 py-6">No comments yet. Be the first to comment!</p>
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="pt-2 flex items-center gap-2">
              <input 
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button 
                type="submit"
                className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
