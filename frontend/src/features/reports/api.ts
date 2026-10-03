import axios from 'axios';
import {apiClient} from '../../shared/api/client';
export type ReportKind='volunteers'|'financial';
export async function downloadReport(campaign:string,kind:ReportKind){
    try{
        const response=await apiClient.get<Blob>('/campaigns/'+campaign+'/reports/'+kind+'.xlsx',{responseType:'blob',timeout:60_000});
        const url=URL.createObjectURL(response.data);
        const anchor=document.createElement('a');anchor.href=url;anchor.download=kind+'-'+campaign+'.xlsx';document.body.append(anchor);
        try{anchor.click();}finally{anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    }catch(error){
        if(axios.isAxiosError(error)&&error.response?.data instanceof Blob){
            const blob:Blob=error.response.data;
            if(blob.type.includes('json')){try{error.response.data=JSON.parse(await blob.text()) as unknown;}catch{/* Preserve the original HTTP error for malformed boundary output. */}}
        }
        throw error;
    }
}
