/** 会话中的用户身份（Cookie 仅存 id，详情查库） */
export interface SessionUser {
  id: string;
}

export interface SessionPayload {
  user: SessionUser;
  /** 会话创建时间（ms） */
  iat: number;
  /** 过期时间（ms） */
  exp: number;
}
