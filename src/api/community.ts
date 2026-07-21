import { api } from './axios'

export type CommunityBoardType = 'STOCK' | 'FREE'

export interface CommunityPost {
  postId: number
  boardType: CommunityBoardType
  ticker?: string
  stockName?: string
  title: string
  content: string
  authorId?: number
  authorNickname: string
  commentCount?: number
  createdAt: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CommunityComment {
  commentId: number
  postId: number
  authorId?: number
  authorNickname: string
  content: string
  createdAt: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CommunityPostListParams {
  boardType?: CommunityBoardType
  ticker?: string
  keyword?: string
  page?: number
  size?: number
}

export interface CommunityPostListResponse {
  items: CommunityPost[]
  total: number
  page: number
  size: number
}

export interface CreateCommunityPostRequest {
  boardType: CommunityBoardType
  ticker?: string
  stockName?: string
  title: string
  content: string
}

export type UpdateCommunityPostRequest = Partial<
  Pick<CreateCommunityPostRequest, 'title' | 'content' | 'ticker' | 'stockName'>
>

export interface CreateCommunityCommentRequest {
  content: string
}

export type UpdateCommunityCommentRequest = CreateCommunityCommentRequest

export const api_get_community_posts = (params?: CommunityPostListParams) =>
  api.get<CommunityPostListResponse | CommunityPost[]>('/community/posts', { params })

export const api_get_community_post = (postId: number | string) =>
  api.get<CommunityPost>(`/community/posts/${postId}`)

export const api_create_community_post = (data: CreateCommunityPostRequest) =>
  api.post<CommunityPost>('/community/posts', data)

export const api_update_community_post = (postId: number | string, data: UpdateCommunityPostRequest) =>
  api.patch<CommunityPost>(`/community/posts/${postId}`, data)

export const api_delete_community_post = (postId: number | string) =>
  api.delete(`/community/posts/${postId}`)

export const api_get_community_comments = (postId: number | string) =>
  api.get<CommunityComment[] | { items?: CommunityComment[] }>(`/community/posts/${postId}/comments`)

export const api_create_community_comment = (postId: number | string, data: CreateCommunityCommentRequest) =>
  api.post<CommunityComment>(`/community/posts/${postId}/comments`, data)

export const api_update_community_comment = (
  postId: number | string,
  commentId: number | string,
  data: UpdateCommunityCommentRequest,
) => api.patch<CommunityComment>(`/community/posts/${postId}/comments/${commentId}`, data)

export const api_delete_community_comment = (postId: number | string, commentId: number | string) =>
  api.delete(`/community/posts/${postId}/comments/${commentId}`)
