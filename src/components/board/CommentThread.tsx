import { useState } from 'react'
import { MessageSquare, Pencil, Trash2 } from 'lucide-react'
import type { TaskComment } from '../../types/kanban'
import { formatTaskDateTime } from '../../utils/taskPresentation'

interface CommentThreadProps {
  comments: TaskComment[]
  currentUserId?: string
  disabled?: boolean
  isSubmitting?: boolean
  isMutatingComment?: boolean
  errorMessage?: string | null
  onAddComment: (content: string) => Promise<void>
  onEditComment: (commentId: string, content: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
}

function CommentThread({
  comments,
  currentUserId,
  disabled = false,
  isSubmitting = false,
  isMutatingComment = false,
  errorMessage,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: CommentThreadProps) {
  const [draft, setDraft] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  async function handleCommentSubmit() {
    const content = draft.trim()
    if (!content) {
      return
    }

    await onAddComment(content)
    setDraft('')
  }

  async function handleCommentUpdate() {
    if (!editingCommentId || !editingContent.trim()) {
      return
    }

    await onEditComment(editingCommentId, editingContent)
    setEditingCommentId(null)
    setEditingContent('')
  }

  return (
    <section className="task-drawer-section">
      <div className="task-section-header">
        <div>
          <p className="dashboard-card-label">Comments</p>
          <h3>Discussion</h3>
        </div>
        <span className="home-status-pill">{comments.length}</span>
      </div>

      <div className="task-comment-composer">
        <label htmlFor="task-comment-input">Add a comment</label>
        <textarea
          id="task-comment-input"
          className="kanban-textarea"
          rows={3}
          disabled={disabled || isSubmitting}
          placeholder="Share context, blockers, or decisions"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="task-section-actions">
          <button
            type="button"
            className="auth-submit"
            disabled={disabled || isSubmitting || !draft.trim()}
            onClick={() => {
              void handleCommentSubmit()
            }}
          >
            {isSubmitting ? 'Posting...' : 'Post comment'}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p className="auth-message auth-message-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {comments.length ? (
        <ul className="task-comment-list" aria-label="Task comments">
          {comments.map((comment) => {
            const isAuthor = comment.authorId === currentUserId
            const isEditing = editingCommentId === comment.id

            return (
              <li key={comment.id} className="task-comment-item">
                <div className="task-activity-icon" aria-hidden="true">
                  <MessageSquare size={16} />
                </div>
                <div className="task-comment-body">
                  <div className="task-comment-header">
                    <div>
                      <strong>{comment.author?.username || comment.author?.email || 'Unknown author'}</strong>
                      <div className="dashboard-meta-row">
                        <span>{formatTaskDateTime(comment.createdAt)}</span>
                        {comment.updatedAt ? <span>Edited</span> : null}
                      </div>
                    </div>
                    {isAuthor ? (
                      <div className="task-section-actions">
                        <button
                          type="button"
                          className="task-icon-button"
                          disabled={disabled || isMutatingComment}
                          aria-label="Edit comment"
                          onClick={() => {
                            setEditingCommentId(comment.id)
                            setEditingContent(comment.content)
                          }}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="task-icon-button task-icon-button-danger"
                          disabled={disabled || isMutatingComment}
                          aria-label="Delete comment"
                          onClick={() => {
                            void onDeleteComment(comment.id)
                          }}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <div className="task-comment-editor">
                      <textarea
                        className="kanban-textarea"
                        rows={3}
                        disabled={disabled || isMutatingComment}
                        value={editingContent}
                        onChange={(event) => setEditingContent(event.target.value)}
                      />
                      <div className="task-section-actions">
                        <button
                          type="button"
                          className="auth-submit auth-submit-secondary task-inline-button"
                          disabled={disabled || isMutatingComment}
                          onClick={() => {
                            setEditingCommentId(null)
                            setEditingContent('')
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="auth-submit task-inline-button"
                          disabled={disabled || isMutatingComment || !editingContent.trim()}
                          onClick={() => {
                            void handleCommentUpdate()
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>{comment.content}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="dashboard-empty-state">
          <h3>No comments yet</h3>
          <p>Conversation around the task will appear here in chronological order.</p>
        </div>
      )}
    </section>
  )
}

export default CommentThread
