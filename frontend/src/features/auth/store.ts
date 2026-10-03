import {create} from 'zustand';
import type {AuthResponse, UserSummary} from './types';

interface AuthState {
    accessToken: string | null;
    user: UserSummary | null;
    initialized: boolean;
    accept: (session: AuthResponse) => void;
    clear: () => void;
    updateUser: (user: UserSummary) => void;
}

export const useAuth = create<AuthState>((set) => ({
    accessToken: null, user: null, initialized: false,
    accept: (session) => set({accessToken: session.accessToken, user: session.user, initialized: true}),
    clear: () => set({accessToken: null, user: null, initialized: true}),
    updateUser: (user) => set({user}),
}));
