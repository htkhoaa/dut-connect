import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../auth/store';
import * as api from './api';
import type {Expense,ExpenseWrite,ExpenseStatus} from './types';
function useFinanceQuery<T>(key:readonly unknown[],fn:()=>Promise<T>,enabled=true){const {user,initialized}=useAuth();return useQuery({queryKey:['finance',user?.id||'public',...key],queryFn:fn,enabled:initialized&&enabled});}
export function useFinancialSummary(id:string){return useFinanceQuery(['summary',id],()=>api.summary(id),!!id);}
export function useFundraisingProgress(ids:string[]){return useFinanceQuery(['progress',ids],()=>api.progress(ids),ids.length>0);}
export function useApprovedExpenses(id:string,page:number){return useFinanceQuery(['approved',id,page],()=>api.approved(id,page),!!id);}
export function useExpenses(id:string|undefined,status:ExpenseStatus|'',page:number){const user=useAuth(s=>s.user);return useFinanceQuery(['expenses',id||'admin',status,page],()=>api.expenses(id,status,page),!!user);}
function useRefreshFinance(){const client=useQueryClient();return async()=>{await Promise.all(['finance','campaigns','dashboard'].map(key=>client.invalidateQueries({queryKey:[key]})));};}
export function useSaveExpense(campaign:string){return useMutation({mutationFn:({values,expense}:{values:ExpenseWrite;expense?:Expense})=>api.save(campaign,values,expense),onSuccess:useRefreshFinance()});}
export function useReviewExpense(){return useMutation({mutationKey:['finance','review'],mutationFn:api.review,onSuccess:useRefreshFinance()});}
