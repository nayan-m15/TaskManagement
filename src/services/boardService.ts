import { fetchBoardsRequest } from '../api/boardsApi'

export async function getBoards() {
  return fetchBoardsRequest()
}
