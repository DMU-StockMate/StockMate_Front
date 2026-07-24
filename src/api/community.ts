import { api } from './axios'

export type CommunityBoardType = 'FREE' | 'STOCK'
export type CommunitySearchType = 'title' | 'content' | 'all'
export type CommunitySortType = 'latest' | 'views' | 'likes' | 'comments'
export type CommunityContentStatus = 'ACTIVE' | 'DELETED'

export interface CommunityAuthor {
  userId: number
  nickname: string
  profileImageUrl: string | null
}

export interface CommunityStockRef {
  stockId: number
  ticker: string
  companyName: string
}

export interface CommunityPost {
  postId: number
  boardType: CommunityBoardType
  userId: number
  author: CommunityAuthor | null
  stock: CommunityStockRef | null
  title: string
  content?: string
  viewCount: number
  likeCount: number
  commentCount: number
  status: CommunityContentStatus
  createdAt: string
  updatedAt: string
}

export interface CommunityComment {
  commentId: number
  postId: number
  userId: number
  author: CommunityAuthor | null
  content: string
  status: CommunityContentStatus
  createdAt: string
  updatedAt: string
}

export interface PageMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PagedResult<T> {
  items: T[]
  meta: PageMeta
}

export interface CommunityPostQueryParams {
  keyword?: string
  searchType?: CommunitySearchType
  sort?: CommunitySortType
  page?: number
  limit?: number
}

export interface CommunityCommentQueryParams {
  page?: number
  limit?: number
}

export interface CreateCommunityPostRequest {
  title: string
  content: string
}

export interface UpdateCommunityPostRequest {
  title?: string
  content?: string
}

export interface CreateCommunityCommentRequest {
  content: string
}

export type UpdateCommunityCommentRequest = CreateCommunityCommentRequest

export const api_get_free_posts = (params?: CommunityPostQueryParams) =>
  api.get<PagedResult<CommunityPost>>('/community/posts/free', { params })

export const api_create_free_post = (data: CreateCommunityPostRequest) =>
  api.post<CommunityPost>('/community/posts/free', data)

export const api_get_stock_posts = (ticker: string, params?: CommunityPostQueryParams) =>
  api.get<PagedResult<CommunityPost>>(`/stocks/${ticker}/community/posts`, { params })

export const api_get_all_stock_posts = (params?: CommunityPostQueryParams) =>
  api.get<PagedResult<CommunityPost>>('/community/posts/stock', { params })

export const api_create_stock_post = (ticker: string, data: CreateCommunityPostRequest) =>
  api.post<CommunityPost>(`/stocks/${ticker}/community/posts`, data)

export const api_get_post_detail = (postId: number | string) =>
  api.get<CommunityPost>(`/community/posts/${postId}`)

export const api_update_post = (postId: number | string, data: UpdateCommunityPostRequest) =>
  api.patch<CommunityPost>(`/community/posts/${postId}`, data)

export const api_delete_post = (postId: number | string) =>
  api.delete<{ message: string; postId: number }>(`/community/posts/${postId}`)

export const api_get_comments = (postId: number | string, params?: CommunityCommentQueryParams) =>
  api.get<PagedResult<CommunityComment>>(`/community/posts/${postId}/comments`, { params })

export const api_create_comment = (postId: number | string, data: CreateCommunityCommentRequest) =>
  api.post<CommunityComment>(`/community/posts/${postId}/comments`, data)

export const api_update_comment = (commentId: number | string, data: UpdateCommunityCommentRequest) =>
  api.patch<CommunityComment>(`/community/comments/${commentId}`, data)

export const api_delete_comment = (commentId: number | string) =>
  api.delete<{ message: string; commentId: number }>(`/community/comments/${commentId}`)

export const api_like_post = (postId: number | string) =>
  api.post<{ message: string; postId: number }>(`/community/posts/${postId}/like`)

export const api_unlike_post = (postId: number | string) =>
  api.delete<{ message: string; postId: number }>(`/community/posts/${postId}/like`)
