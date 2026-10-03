import type {SkillTrack} from '../campaigns/types';

export type Confidence='LOW'|'MEDIUM'|'HIGH';
export interface Recommendation {
    applicationId:string;score:number;recommendedTrack:SkillTrack;matchedSkills:string[];
    missingSkills:string[];reason:string;confidence:Confidence;
}
export interface MatchResponse {generatedAt:string;model:string;recommendations:Recommendation[]}
export interface AiAvailability {available:boolean;maxApplicants:number}
