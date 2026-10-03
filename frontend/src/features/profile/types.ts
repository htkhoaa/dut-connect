import type {UserSummary} from '../auth/types';

export type Track = 'TECHNICAL' | 'LOGISTICS';

export interface Skill {
    id: string;
    name: string;
    active: boolean
}

export interface Profile {
    user: UserSummary;
    faculty: string;
    bio: string | null;
    preferredTrack: Track | null;
    experience: string | null;
    version: number;
    skills: Skill[];
}

export interface ProfileValues {
    fullName: string;
    faculty: string;
    bio: string;
    preferredTrack: Track | '';
    experience: string;
}

export interface ProfileRequest extends Omit<ProfileValues, 'preferredTrack'> {
    preferredTrack: Track | null;
    version: number;
    userVersion: number;
}

export interface SkillsValues {
    skillIds: string[];
}

export interface SkillsRequest extends SkillsValues {
    version: number;
}
