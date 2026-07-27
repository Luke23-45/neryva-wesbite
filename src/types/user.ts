export interface UpdateProfileDTO {
  name?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}
