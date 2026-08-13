/** 可安全在客户端引用的用户公开字段 */
export type PublicUser = {
  id: string;
  provider: string;
  email: string | null;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  trustLevel: number | null;
  credits: number;
  isAdmin: boolean;
  lastCheckIn: string | null;
  createdAt: string;
};
