/** Linux.do Connect 用户（会话中持久化的最小字段） */
export interface LinuxDoUser {
  id: number | string;
  username: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  trustLevel?: number;
  active?: boolean;
}

export interface SessionPayload {
  user: LinuxDoUser;
  /** 会话创建时间（ms） */
  iat: number;
  /** 过期时间（ms） */
  exp: number;
}
