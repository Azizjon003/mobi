export type UserRole = 'super_admin' | 'seller' | 'collector' | 'seller_collector';

export interface User {
  userId: number;
  role: UserRole;
  addedAt: Date;
  addedBy: number;
}

export interface Document {
  id: string;
  fileName: string;
  fullName: string;
  applicationNumber: string;
  fileId: string;
  channelMessageId: number;
  uploadedAt: Date;
  uploadedBy: number;
}

export interface UserSession {
  step: 'IDLE' | 'WAITING_NAME' | 'WAITING_APP_NUMBER' | 'WAITING_SEARCH';
  tempData?: {
    fileId?: string;
    fileName?: string;
    fullName?: string;
  };
}
