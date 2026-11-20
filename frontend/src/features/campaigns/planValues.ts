import type { Content, FormValues } from './types';

function localTime(value: string | null | undefined) {
    if (!value) return '';
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 23);
}

export function defaults(content?: Content): FormValues {
    return {
        organizerType: content?.organizerType || 'INDIVIDUAL',
        organizationId: content?.organizationId || '',
        categoryId: content?.categoryId || '',
        title: content?.title || '',
        summary: content?.summary || '',
        description: content?.description || '',
        expectedImpact: content?.expectedImpact || '',
        contributionMode: content?.contributionMode || 'VOLUNTEER_ONLY',
        startDate: content?.startDate || '',
        endDate: content?.endDate || '',
        applicationDeadline: localTime(content?.applicationDeadline),
        fundraisingDeadline: localTime(content?.fundraisingDeadline),
        targetVolunteerCount: content?.targetVolunteerCount?.toString() || '',
        targetTechnicalCount: content?.targetTechnicalCount?.toString() || '',
        targetLogisticsCount: content?.targetLogisticsCount?.toString() || '',
        volunteerRequirements: content?.volunteerRequirements || '',
        fundraisingGoal: content?.fundraisingGoal || '',
        institutionalFunding: content?.institutionalFunding || '0',
        sponsorName: content?.sponsorName || '',
        sponsorFunding: content?.sponsorFunding || '0',
        estimatedBudget: content?.estimatedBudget || '',
        donationBankName: content?.donationBankName || '',
        donationAccountNumber: content?.donationAccountNumber || '',
        donationAccountHolder: content?.donationAccountHolder || '',
    };
}

function instant(value: string, original?: string | null) {
    const date = new Date(value);
    return original && date.getTime() === new Date(original).getTime()
        ? original
        : date.toISOString();
}

export function payload(v: FormValues, original?: Content): Content {
    const donations = v.contributionMode !== 'VOLUNTEER_ONLY';
    const volunteers = v.contributionMode !== 'DONATION_ONLY';
    return {
        ...v,
        organizerType: v.organizerType as Content['organizerType'],
        contributionMode: v.contributionMode as Content['contributionMode'],
        organizationId: v.organizerType === 'ORGANIZATION' ? v.organizationId : null,
        expectedImpact: v.expectedImpact.trim() || null,
        targetVolunteerCount:
            volunteers && v.targetVolunteerCount ? Number(v.targetVolunteerCount) : null,
        targetTechnicalCount:
            volunteers && v.targetTechnicalCount ? Number(v.targetTechnicalCount) : null,
        targetLogisticsCount:
            volunteers && v.targetLogisticsCount ? Number(v.targetLogisticsCount) : null,
        applicationDeadline:
            volunteers && v.applicationDeadline
                ? instant(v.applicationDeadline, original?.applicationDeadline)
                : null,
        fundraisingDeadline:
            donations && v.fundraisingDeadline
                ? instant(v.fundraisingDeadline, original?.fundraisingDeadline)
                : null,
        fundraisingGoal: donations ? v.fundraisingGoal || null : null,
        volunteerRequirements: volunteers ? v.volunteerRequirements.trim() || null : null,
        institutionalFunding: v.institutionalFunding || '0',
        sponsorFunding: v.sponsorFunding || '0',
        sponsorName: v.sponsorName.trim() || null,
        estimatedBudget: v.estimatedBudget || null,
        donationBankName: donations ? v.donationBankName.trim() || null : null,
        donationAccountNumber: donations ? v.donationAccountNumber.trim() || null : null,
        donationAccountHolder: donations ? v.donationAccountHolder.trim() || null : null,
    };
}
