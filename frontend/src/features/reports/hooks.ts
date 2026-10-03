import {useMutation} from '@tanstack/react-query';
import {downloadReport,type ReportKind} from './api';
export function useDownloadReport(campaign:string){return useMutation({mutationFn:(kind:ReportKind)=>downloadReport(campaign,kind)});}
