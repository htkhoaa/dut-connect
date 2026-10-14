export type Role = 'ADMIN' | 'USER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';

export interface UserSummary {
    id: string;
    studentId: string;
    email: string;
    fullName: string;
    role: Role;
    status: AccountStatus;
    version: number;
    createdAt: string;
}

export interface AuthResponse {
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    user: UserSummary
}

export interface LoginValues {
    studentId: string;
    password: string
}

export interface RegisterValues extends LoginValues {
    email: string;
    fullName: string;
    faculty: string
}
