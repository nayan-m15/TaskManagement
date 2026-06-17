import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { CreateTaskLabelInput, TaskLabel } from '../../types/kanban'

const DEFAULT_LABEL_COLOR = '#64748b'

interface LabelSelectorProps {
  labels: TaskLabel[]
  value: string[]
  disabled?: boolean
  isCreatingLabel?: boolean
  onChange: (value: string[]) => void
  onCreateLabel?: (input: CreateTaskLabelInput) => Promise<TaskLabel | null | undefined>
}

function LabelSelector({
  labels,
  value,
  disabled = false,
  isCreatingLabel = false,
  onChange,
  onCreateLabel,
}: LabelSelectorProps) {
  const [draftName, setDraftName] = useState('')
  const [draftColor, setDraftColor] = useState(DEFAULT_LABEL_COLOR)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const sortedLabels = useMemo(
    () => [...labels].sort((first, second) => first.name.localeCompare(second.name)),
    [labels],
  )

  function toggleLabel(labelId: string) {
    if (value.includes(labelId)) {
      onChange(value.filter((currentId) => currentId !== labelId))
      return
    }

    onChange([...value, labelId])
  }

  async function handleCreateLabel() {
    if (!onCreateLabel) {
      return
    }

    const name = draftName.trim()
    if (!name) {
      setErrorMessage('Label name is required.')
      return
    }

    setErrorMessage(null)

    try {
      const createdLabel = await onCreateLabel({
        name,
        color: draftColor,
      })

      if (createdLabel && !value.includes(createdLabel.id)) {
        onChange([...value, createdLabel.id])
      }

      setDraftName('')
      setDraftColor(DEFAULT_LABEL_COLOR)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create the label.')
    }
  }

  return (
    <div className="task-label-selector">
      {sortedLabels.length ? (
        <div className="task-label-grid" role="group" aria-label="Task labels">
          {sortedLabels.map((label) => {
            const isSelected = value.includes(label.id)

            return (
              <button
                key={label.id}
                type="button"
                className={`task-label-chip${isSelected ? ' task-label-chip-selected' : ''}`}
                disabled={disabled}
                onClick={() => toggleLabel(label.id)}
              >
                <span
                  className="task-label-chip-dot"
                  style={{ backgroundColor: label.color || DEFAULT_LABEL_COLOR }}
                  aria-hidden="true"
                />
                {label.name}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="dashboard-empty-state">
          <h3>No labels yet</h3>
          <p>Create the first label for this board from the controls below.</p>
        </div>
      )}

      {onCreateLabel ? (
        <div className="task-label-create-row">
          <div className="task-label-create-fields">
            <input
              className="kanban-input"
              value={draftName}
              disabled={disabled || isCreatingLabel}
              placeholder="Create a new label"
              onChange={(event) => setDraftName(event.target.value)}
            />
            <input
              aria-label="Label color"
              type="color"
              className="task-color-input"
              value={draftColor}
              disabled={disabled || isCreatingLabel}
              onChange={(event) => setDraftColor(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="auth-submit auth-submit-secondary task-inline-button"
            disabled={disabled || isCreatingLabel}
            onClick={() => {
              void handleCreateLabel()
            }}
          >
            <Plus size={16} aria-hidden="true" />
            {isCreatingLabel ? 'Creating...' : 'Add label'}
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="auth-message auth-message-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}

export default LabelSelector
