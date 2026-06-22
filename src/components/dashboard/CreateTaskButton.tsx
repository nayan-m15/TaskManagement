interface CreateTaskButtonProps {
  onClick: () => void
  disabled?: boolean
}

function CreateTaskButton({ onClick, disabled = false }: CreateTaskButtonProps) {
  return (
    <button type="button" className="auth-submit" onClick={onClick} disabled={disabled}>
      New Task
    </button>
  )
}

export default CreateTaskButton
