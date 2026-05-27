import { fetchTasksRequest } from '../api/tasksApi'

export async function getTasks() {
  return fetchTasksRequest()
}
