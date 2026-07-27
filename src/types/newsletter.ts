export interface SubscribeDTO {
  email: string;
  source?: string;
}

export interface UnsubscribeDTO {
  email: string;
  reason?: string;
}
