export type ExpenseStatus='PENDING'|'APPROVED'|'REJECTED';
export interface FinancialSummary {campaignId:string;institutionalFunding:string;sponsorFunding:string;verifiedDonations:string;totalFunding:string;approvedExpenses:string;remainingFunds:string;fundraisingGoal:string|null;successfulDonationCount:number}
export interface FundraisingProgress {campaignId:string;verifiedDonations:string;successfulDonationCount:number}
export interface PublicExpense {id:string;campaignId:string;title:string;category:string;amount:string;expenseDate:string;description:string|null;proofReference:string|null;approvedAt:string}
export interface Expense extends Omit<PublicExpense,'approvedAt'> {campaignTitle:string;status:ExpenseStatus;submittedByUserId:string;submittedByName:string;reviewedByUserId:string|null;reviewedByName:string|null;reviewedAt:string|null;rejectionReason:string|null;createdAt:string;updatedAt:string;version:number;canEdit:boolean}
export interface ExpenseWrite {title:string;category:string;amount:string;expenseDate:string;description:string;proofReference:string}
export type ExpenseReview={id:string;version:number;command:'approve'}|{id:string;version:number;command:'reject';reason:string};
