import { useRef, type ChangeEvent } from 'react'
import { Download, Paperclip, Upload } from 'lucide-react'
import type { TaskAttachment } from '../../types/kanban'
import { formatTaskDateTime } from '../../utils/taskPresentation'

interface AttachmentListProps {
  attachments: TaskAttachment[]
  canUpload: boolean
  isUploading: boolean
  disabled?: boolean
  emptyMessage?: string
  helpMessage?: string | null
  onUpload?: (file: File) => Promise<void>
}

function formatFileSize(fileSize?: number | null) {
  if (!fileSize) {
    return null
  }

  if (fileSize < 1024) {
    return `${fileSize} B`
  }

  if (fileSize < 1024 * 1024) {
    return `${Math.round(fileSize / 1024)} KB`
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
}

function AttachmentList({
  attachments,
  canUpload,
  isUploading,
  disabled = false,
  emptyMessage = 'No files have been attached yet.',
  helpMessage,
  onUpload,
}: AttachmentListProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !onUpload) {
      return
    }

    await onUpload(file)
    event.target.value = ''
  }

  return (
    <section className="task-drawer-section">
      <div className="task-section-header">
        <div>
          <p className="dashboard-card-label">Attachments</p>
          <h3>Files</h3>
        </div>
        <div className="task-section-actions">
          <input
            ref={inputRef}
            hidden
            type="file"
            onChange={(event) => {
              void handleFileChange(event)
            }}
          />
          <button
            type="button"
            className="auth-submit auth-submit-secondary task-inline-button"
            disabled={!canUpload || disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={16} aria-hidden="true" />
            {isUploading ? 'Uploading...' : 'Upload file'}
          </button>
        </div>
      </div>

      {helpMessage ? <p className="task-section-help">{helpMessage}</p> : null}

      {attachments.length ? (
        <ul className="task-activity-list" aria-label="Task attachments">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="task-activity-item">
              <div className="task-activity-icon" aria-hidden="true">
                <Paperclip size={16} />
              </div>
              <div className="task-activity-content">
                <strong>{attachment.fileName || 'Attached file'}</strong>
                <div className="dashboard-meta-row">
                  <span>{attachment.fileType || 'Unknown type'}</span>
                  {formatFileSize(attachment.fileSize) ? <span>{formatFileSize(attachment.fileSize)}</span> : null}
                  <span>{formatTaskDateTime(attachment.uploadedAt)}</span>
                </div>
                <div className="dashboard-meta-row">
                  <span>{attachment.uploader?.username || attachment.uploader?.email || 'Uploader unavailable'}</span>
                </div>
              </div>
              <a
                className="dashboard-inline-link task-inline-link"
                href={attachment.fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={16} aria-hidden="true" />
                Open
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="dashboard-empty-state">
          <h3>No attachments yet</h3>
          <p>{emptyMessage}</p>
        </div>
      )}
    </section>
  )
}

export default AttachmentList
