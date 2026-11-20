import { z } from 'zod';
import { tr } from '../../../shared/lib/i18n';

const optionalMoney = z
    .string()
    .trim()
    .refine((v) => !v || /^\d{1,19}$/.test(v), 'Nhập số tiền VND nguyên, tối đa 19 chữ số');
const optionalCount = z
    .string()
    .trim()
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) <= 2147483647), 'Nhập số nguyên không âm');

export const planSchema = z
    .object({
        organizerType: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
        organizationId: z.string(),
        categoryId: z.string().min(1, 'Chọn danh mục'),
        title: z.string().trim().min(1, 'Tiêu đề là bắt buộc').max(200),
        summary: z.string().trim().min(1, 'Tóm tắt là bắt buộc').max(500),
        description: z.string().trim().min(1, 'Mô tả chi tiết là bắt buộc').max(20000),
        expectedImpact: z.string().trim().min(1, 'Giá trị hướng đến là bắt buộc').max(10000),
        contributionMode: z.enum(['VOLUNTEER_ONLY', 'DONATION_ONLY', 'HYBRID']),
        startDate: z.string().min(1, 'Chọn ngày bắt đầu'),
        endDate: z.string().min(1, 'Chọn ngày kết thúc'),
        applicationDeadline: z.string(),
        fundraisingDeadline: z.string(),
        targetVolunteerCount: optionalCount,
        targetTechnicalCount: optionalCount,
        targetLogisticsCount: optionalCount,
        volunteerRequirements: z.string().max(10000),
        fundraisingGoal: optionalMoney,
        institutionalFunding: optionalMoney,
        sponsorName: z.string().max(200),
        sponsorFunding: optionalMoney,
        estimatedBudget: optionalMoney,
        donationBankName: z.string().max(120),
        donationAccountNumber: z.string().max(64),
        donationAccountHolder: z.string().max(200),
    })
    .superRefine((v, ctx) => {
        if (!z.uuid().safeParse(v.categoryId).success) {
            ctx.addIssue({
                code: 'custom',
                path: ['categoryId'],
                message: tr('Chọn danh mục hợp lệ'),
            });
        }
        if (v.endDate < v.startDate) {
            ctx.addIssue({
                code: 'custom',
                path: ['endDate'],
                message: tr('Ngày kết thúc không được trước ngày bắt đầu'),
            });
        }
        if (v.organizerType === 'ORGANIZATION' && !z.uuid().safeParse(v.organizationId).success) {
            ctx.addIssue({
                code: 'custom',
                path: ['organizationId'],
                message: tr('Chọn tổ chức đã xác minh'),
            });
        }
        // Volunteer requirements check
        if (v.contributionMode !== 'DONATION_ONLY') {
            if (!v.targetVolunteerCount || Number(v.targetVolunteerCount) < 1) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['targetVolunteerCount'],
                    message: tr('Cần nhập chỉ tiêu ít nhất một tình nguyện viên'),
                });
            }
            if (!v.applicationDeadline || Number.isNaN(new Date(v.applicationDeadline).getTime())) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['applicationDeadline'],
                    message: tr('Hạn đăng ký là bắt buộc'),
                });
            }
            if (!v.volunteerRequirements.trim()) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['volunteerRequirements'],
                    message: tr('Yêu cầu tình nguyện viên là bắt buộc'),
                });
            }
        }
        // Fundraising requirements check
        if (v.contributionMode !== 'VOLUNTEER_ONLY') {
            if (
                !v.fundraisingGoal ||
                !/^\d+$/.test(v.fundraisingGoal) ||
                BigInt(v.fundraisingGoal) === 0n
            ) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['fundraisingGoal'],
                    message: tr('Mục tiêu gây quỹ phải lớn hơn 0'),
                });
            }
            if (!v.fundraisingDeadline || Number.isNaN(new Date(v.fundraisingDeadline).getTime())) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['fundraisingDeadline'],
                    message: tr('Hạn gây quỹ là bắt buộc'),
                });
            }
            for (const name of [
                'donationBankName',
                'donationAccountNumber',
                'donationAccountHolder',
            ] as const) {
                if (!v[name].trim()) {
                    ctx.addIssue({
                        code: 'custom',
                        path: [name],
                        message: tr('Thông tin tài khoản nhận ủng hộ là bắt buộc'),
                    });
                }
            }
        }
        for (const name of ['applicationDeadline', 'fundraisingDeadline'] as const) {
            if (v[name] && Number.isNaN(new Date(v[name]).getTime())) {
                ctx.addIssue({
                    code: 'custom',
                    path: [name],
                    message: tr('Nhập ngày và giờ hợp lệ'),
                });
            }
        }
    });
