import {createBrowserRouter} from 'react-router-dom';
import {AppLayout} from '../layout/AppLayout';
import {HomePage} from '../pages/HomePage';
import {NotFoundPage} from '../pages/NotFoundPage';
import {lazy} from 'react';
import {RouteGuard} from '../../features/auth/RouteGuard';

const AuthPage = lazy(() => import('../../features/auth/AuthPage').then((m) => ({default: m.AuthPage})));
const ProfilePage = lazy(() => import('../../features/profile/ProfilePage').then((m) => ({default: m.ProfilePage})));
const UsersPage = lazy(() => import('../../features/admin/users/UsersPage').then((m) => ({default: m.UsersPage})));
const OrganizationListPage = lazy(() => import('../../features/organizations/OrganizationListPage').then((m) => ({default: m.OrganizationListPage})));
const OrganizationDetailPage = lazy(() => import('../../features/organizations/OrganizationDetailPage').then((m) => ({default: m.OrganizationDetailPage})));
const CreateOrganizationPage = lazy(() => import('../../features/organizations/CreateOrganizationPage').then((m) => ({default: m.CreateOrganizationPage})));
const CampaignListPage = lazy(() => import('../../features/campaigns/CampaignListPage').then(m=>({default:m.CampaignListPage})));
const CampaignDetailPage = lazy(() => import('../../features/campaigns/CampaignDetailPage').then(m=>({default:m.CampaignDetailPage})));
const CampaignWorkspacePage = lazy(() => import('../../features/campaigns/CampaignWorkspacePage').then(m=>({default:m.CampaignWorkspacePage})));
const CategoryManagementPage = lazy(() => import('../../features/campaigns/CategoryManagementPage').then(m=>({default:m.CategoryManagementPage})));
const CreateProposalPage = lazy(() => import('../../features/proposals/CreateProposalPage').then(m=>({default:m.CreateProposalPage})));
const ProposalListPage = lazy(() => import('../../features/proposals/ProposalListPage').then(m=>({default:m.ProposalListPage})));
const ProposalDetailPage = lazy(() => import('../../features/proposals/ProposalDetailPage').then(m=>({default:m.ProposalDetailPage})));
const ApplicationsPage = lazy(() => import('../../features/volunteers/ApplicationsPage').then(m=>({default:m.ApplicationsPage})));

const MeetingsPage=lazy(()=>import('../../features/meetings/MeetingsPage').then(m=>({default:m.MeetingsPage})));
const TasksPage=lazy(()=>import('../../features/tasks/TasksPage').then(m=>({default:m.TasksPage})));
const AttendancePage=lazy(()=>import('../../features/attendance/AttendancePage').then(m=>({default:m.AttendancePage})));
const CompletionPage=lazy(()=>import('../../features/volunteers/CompletionPage').then(m=>({default:m.CompletionPage})));
const HistoryPage=lazy(()=>import('../../features/volunteers/HistoryPage').then(m=>({default:m.HistoryPage})));
const DonationsPage=lazy(()=>import('../../features/donations/DonationsPage').then(m=>({default:m.DonationsPage})));
const PaymentResultPage=lazy(()=>import('../../features/donations/PaymentResultPage').then(m=>({default:m.PaymentResultPage})));
const MockCheckoutPage=lazy(()=>import('../../features/donations/MockCheckoutPage').then(m=>({default:m.MockCheckoutPage})));
const FinancePage=lazy(()=>import('../../features/finance/FinancePage').then(m=>({default:m.FinancePage})));
const AdminExpensesPage=lazy(()=>import('../../features/finance/AdminExpensesPage').then(m=>({default:m.AdminExpensesPage})));
const MatchingPage=lazy(()=>import('../../features/ai/MatchingPage').then(m=>({default:m.MatchingPage})));
const AdminDashboardPage=lazy(()=>import('../../features/dashboard/AdminDashboardPage').then(m=>({default:m.AdminDashboardPage})));
const ReportsPage=lazy(()=>import('../../features/reports/ReportsPage').then(m=>({default:m.ReportsPage})));
export const router = createBrowserRouter([
    {
        element: <AppLayout/>,
        children: [
            {path: '/', element: <HomePage/>},
            {path: '/login', element: <AuthPage/>},
            {path: '/register', element: <AuthPage registration/>},
            {path: '/campaigns', element: <CampaignListPage/>},
            {path: '/campaigns/:id', element: <CampaignDetailPage/>},
            {path: '/organizations', element: <OrganizationListPage/>},
            {path: '/organizations/:id', element: <OrganizationDetailPage/>},
            {element: <RouteGuard/>, children: [
                {path: '/me/profile', element: <ProfilePage/>},
                {path:'/me/donations',element:<DonationsPage/>},
                {path:'/donations/:donationId',element:<PaymentResultPage/>},
                {path:'/payment/result',element:<PaymentResultPage/>},
                {path:'/dev/mock-payments/:paymentId',element:<MockCheckoutPage/>},
                {path:'/me/tasks',element:<TasksPage mine/>},
                {path:'/tasks/:taskId',element:<TasksPage detail/>},
                {path:'/me/history',element:<HistoryPage/>},
                {path:'/me/campaigns/:campaignId/meetings',element:<MeetingsPage student/>},
                {path:'/manage/campaigns/:campaignId/tasks',element:<TasksPage/>},
                {path:'/manage/campaigns/:campaignId/meetings',element:<MeetingsPage/>},
                {path:'/manage/campaigns/:campaignId/attendance',element:<AttendancePage/>},
                {path:'/manage/campaigns/:campaignId/completions',element:<CompletionPage/>},
                {path:'/manage/campaigns/:campaignId/finance',element:<FinancePage/>},
                {path:'/manage/campaigns/:campaignId/ai',element:<MatchingPage/>},
                {path:'/manage/campaigns/:campaignId/reports',element:<ReportsPage/>},
                {path: '/me/applications', element: <ApplicationsPage mine/>},
                {path: '/me/organizations', element: <OrganizationListPage scope="mine"/>},
                {path: '/organizations/new', element: <CreateOrganizationPage/>},
                {path: '/proposals/new', element: <CreateProposalPage/>},
                {path: '/proposals', element: <ProposalListPage/>},
                {path: '/proposals/:id', element: <ProposalDetailPage/>},
                {path: '/manage/campaigns', element: <CampaignListPage scope="mine"/>},
                {path: '/manage/campaigns/:campaignId', element: <CampaignWorkspacePage/>},
                {path: '/manage/campaigns/:campaignId/applications', element: <ApplicationsPage/>},
                {path: '/manage/campaigns/:campaignId/team', element: <ApplicationsPage team/>},
            ]},
            {element: <RouteGuard admin/>, children: [
                {path:'/admin',element:<AdminDashboardPage/>},
                {path: '/admin/users', element: <UsersPage/>},
                {path: '/admin/expenses', element: <AdminExpensesPage/>},
                {path: '/admin/organizations', element: <OrganizationListPage scope="admin"/>},
                {path: '/admin/proposals', element: <ProposalListPage admin/>},
                {path: '/admin/categories', element: <CategoryManagementPage/>},
                {path: '/admin/campaigns', element: <CampaignListPage scope="admin"/>},
            ]},
            {path: '*', element: <NotFoundPage/>},
        ],
    },
]);
