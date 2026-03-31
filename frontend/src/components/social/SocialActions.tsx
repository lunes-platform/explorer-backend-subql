import React, { useState } from 'react';
import {
  ThumbsUp,
  Heart,
  UserPlus,
  UserCheck,
  MessageSquare,
  Send,
  Smile,
} from 'lucide-react';
import { LunesLogo } from '../common/LunesLogo';
import type { ProjectSocialData, ProjectComment } from '../../hooks/useSocialInteractions';

interface SocialActionsProps {
  socialData: ProjectSocialData;
  userInteractions: { liked: boolean; loved: boolean; following: boolean };
  isConnected: boolean;
  userAddress?: string;
  onLike: () => void;
  onLove: () => void;
  onFollow: () => void;
  onDonate: () => void;
  onComment: (text: string, metadata?: { gif?: string | null }) => void;
  onCommentReaction?: (commentId: string, emoji: string) => void;
  hasDonationAddress?: boolean;
}

const MAX_COMMENT_LENGTH = 350;
const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🚀', '👏', '😂', '😮', '🎉', '💯', '🔮'];

function shortAddr(addr: string): string {
  if (!addr || addr.length < 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

export const SocialActions: React.FC<SocialActionsProps> = ({
  socialData,
  userInteractions,
  isConnected,
  userAddress,
  onLike,
  onLove,
  onFollow,
  onDonate,
  onComment,
  onCommentReaction,
  hasDonationAddress = true,
}) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);

  const handleSubmitComment = () => {
    if (commentText.trim() && commentText.length <= MAX_COMMENT_LENGTH) {
      onComment(commentText, selectedGif ? { gif: selectedGif } : undefined);
      setCommentText('');
      setSelectedGif(null);
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    if (commentText.length + emoji.length <= MAX_COMMENT_LENGTH) {
      setCommentText(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const charCount = commentText.length;
  const isOverLimit = charCount > MAX_COMMENT_LENGTH;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Action Buttons Row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Like */}
        <ActionButton
          icon={<ThumbsUp size={16} />}
          label={socialData.likes > 0 ? socialData.likes.toString() : 'Like'}
          active={userInteractions.liked}
          activeColor="#3b82f6"
          onClick={onLike}
          disabled={!isConnected}
          tooltip={!isConnected ? 'Connect wallet to like' : undefined}
        />

        {/* Love */}
        <ActionButton
          icon={<Heart size={16} fill={userInteractions.loved ? '#ef4444' : 'none'} />}
          label={socialData.loves > 0 ? socialData.loves.toString() : 'Love'}
          active={userInteractions.loved}
          activeColor="#ef4444"
          onClick={onLove}
          disabled={!isConnected}
        />

        {/* Follow */}
        <ActionButton
          icon={userInteractions.following ? <UserCheck size={16} /> : <UserPlus size={16} />}
          label={userInteractions.following
            ? `Following (${socialData.followers})`
            : `Follow${socialData.followers > 0 ? ` (${socialData.followers})` : ''}`
          }
          active={userInteractions.following}
          activeColor="#26d07c"
          onClick={onFollow}
          disabled={!isConnected}
        />

        <div style={{ flex: 1 }} />

        {/* Donate — only shown when a donation address is configured */}
        {hasDonationAddress && <button
          onClick={onDonate}
          disabled={!isConnected}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10, border: 'none',
            background: isConnected
              ? 'linear-gradient(135deg, #26d07c, #1a9d5c)'
              : 'rgba(255,255,255,0.05)',
            color: isConnected ? 'white' : 'var(--text-muted)',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            fontSize: 13, fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: isConnected ? '0 2px 8px rgba(38, 208, 124, 0.3)' : 'none',
          }}
        >
          <LunesLogo size={14} color={isConnected ? 'white' : '#666'} />
          Donate LUNES
          {socialData.donations > 0 && (
            <span style={{
              background: 'rgba(255,255,255,0.2)', padding: '1px 6px',
              borderRadius: 4, fontSize: 11, marginLeft: 2,
            }}>
              {socialData.donations}
            </span>
          )}
        </button>}

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 8, border: 'none',
            background: showComments ? 'rgba(108, 56, 255, 0.15)' : 'rgba(255,255,255,0.05)',
            color: showComments ? 'var(--color-brand-400)' : 'var(--text-muted)',
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
            transition: 'all 0.2s',
          }}
        >
          <MessageSquare size={14} />
          {socialData.comments.length > 0 ? socialData.comments.length : ''}
        </button>
      </div>

      {/* Stats summary */}
      {(socialData.donatedAmount > 0 || socialData.followers > 0) && (
        <div style={{
          display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap',
        }}>
          {socialData.donatedAmount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <LunesLogo size={12} /> {socialData.donatedAmount.toLocaleString()} LUNES donated
            </span>
          )}
          {socialData.followers > 0 && (
            <span>{socialData.followers} follower{socialData.followers !== 1 ? 's' : ''}</span>
          )}
          {socialData.likes > 0 && (
            <span>{socialData.likes} like{socialData.likes !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          background: 'rgba(255,255,255,0.02)', borderRadius: 12,
          padding: 16, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            Comments ({socialData.comments.length})
          </h4>

          {/* Comment input */}
          {isConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitComment()}
                    placeholder="Write a comment..."
                    maxLength={MAX_COMMENT_LENGTH + 50}
                    style={{
                      width: '100%', padding: '10px 70px 10px 14px', borderRadius: 8,
                      border: `1px solid ${isOverLimit ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                      background: 'rgba(255,255,255,0.03)', color: 'white',
                      fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <span style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 11, color: isOverLimit ? '#ef4444' : 'var(--text-muted)',
                  }}>
                    {charCount}/{MAX_COMMENT_LENGTH}
                  </span>
                </div>
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isOverLimit}
                  style={{
                    padding: '8px 14px', borderRadius: 8, border: 'none',
                    background: commentText.trim() && !isOverLimit ? 'var(--color-brand-600)' : 'rgba(255,255,255,0.05)',
                    color: commentText.trim() && !isOverLimit ? 'white' : 'var(--text-muted)',
                    cursor: commentText.trim() && !isOverLimit ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Send size={14} />
                </button>
              </div>

              {/* Emoji picker toggle */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                    background: showEmojiPicker ? 'rgba(108, 56, 255, 0.15)' : 'transparent',
                    color: showEmojiPicker ? 'var(--color-brand-400)' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: 12,
                  }}
                >
                  <Smile size={14} />
                  Emoji
                </button>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {selectedGif ? 'GIF attached' : ''}
                </span>
              </div>

              {/* Emoji picker panel */}
              {showEmojiPicker && (
                <div style={{
                  display: 'flex', gap: 6, flexWrap: 'wrap',
                  padding: 10, background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {COMMON_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      style={{
                        fontSize: 20, padding: 4, borderRadius: 4,
                        border: 'none', background: 'transparent',
                        cursor: 'pointer', lineHeight: 1,
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Connect wallet to comment
            </p>
          )}

          {/* Comment list */}
          {socialData.comments.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, textAlign: 'center', padding: '12px 0' }}>
              No comments yet. Be the first!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
              {socialData.comments.map((comment: ProjectComment) => (
                <div key={comment.id} style={{
                  display: 'flex', gap: 10, padding: '10px 12px',
                  background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6C38FF, #ec4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
                  }}>
                    {comment.author.slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-brand-400)', fontFamily: 'monospace' }}>
                        {shortAddr(comment.author)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {timeAgo(comment.timestamp)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4, color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                      {comment.text}
                    </p>
                    
                    {/* Comment reactions */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {COMMON_EMOJIS.slice(0, 6).map(emoji => {
                        const reactions = comment.metadata?.reactions || [];
                        const count = reactions.filter(r => r.emoji === emoji).length;
                        const userReacted = userAddress && reactions.some(r => r.userAddress === userAddress && r.emoji === emoji);
                        return (
                          <button
                            key={emoji}
                            onClick={() => onCommentReaction?.(comment.id, emoji)}
                            disabled={!isConnected}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 2,
                              padding: '2px 6px', borderRadius: 12,
                              border: '1px solid',
                              borderColor: userReacted ? 'rgba(108, 56, 255, 0.5)' : 'rgba(255,255,255,0.1)',
                              background: userReacted ? 'rgba(108, 56, 255, 0.15)' : 'transparent',
                              color: 'var(--text-muted)',
                              cursor: isConnected ? 'pointer' : 'not-allowed',
                              fontSize: 12, opacity: isConnected ? 1 : 0.5,
                            }}
                          >
                            {emoji} {count > 0 && <span style={{ fontSize: 10 }}>{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* Reusable action button */
const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  activeColor: string;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}> = ({ icon, label, active, activeColor, onClick, disabled, tooltip }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', borderRadius: 8, border: '1px solid',
      borderColor: active ? `${activeColor}40` : 'rgba(255,255,255,0.08)',
      background: active ? `${activeColor}15` : 'rgba(255,255,255,0.03)',
      color: active ? activeColor : disabled ? 'rgba(255,255,255,0.3)' : 'var(--text-secondary)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 13, fontWeight: active ? 600 : 500,
      transition: 'all 0.2s',
    }}
  >
    {icon}
    {label}
  </button>
);

export default SocialActions;
