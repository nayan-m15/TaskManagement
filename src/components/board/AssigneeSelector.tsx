import type { BoardAssignee } from '../../types/kanban'

interface AssigneeSelectorProps {
  id?: string
  members: BoardAssignee[]
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}

function getMemberLabel(member: BoardAssignee) {
  if (member.username && member.email) {
    return `${member.username} (${member.email})`
  }

  return member.username || member.email || member.id
}

function AssigneeSelector({
  id = 'task-assignee',
  members,
  value,
  disabled = false,
  onChange,
}: AssigneeSelectorProps) {
  return (
    <select
      id={id}
      className="kanban-input"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Unassigned</option>
      {members.map((member) => (
        <option key={member.id} value={member.id}>
          {getMemberLabel(member)}
        </option>
      ))}
    </select>
  )
}

export default AssigneeSelector
