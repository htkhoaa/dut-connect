package vn.edu.dut.connect.finance.infrastructure.persistence;

import java.util.*;
import java.math.BigDecimal;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.finance.application.ExpenseRepository;
import vn.edu.dut.connect.finance.domain.*;
import vn.edu.dut.connect.identity.application.Pagination;
import vn.edu.dut.connect.shared.application.PageResult;

@Repository
public class ExpensePersistence implements ExpenseRepository {
    private final JpaExpenseRepository expenses;
    private final JdbcClient jdbc;
    public ExpensePersistence(JpaExpenseRepository expenses,JdbcClient jdbc){this.expenses=expenses;this.jdbc=jdbc;}
    public Optional<Expense> find(UUID id){return expenses.findById(id);}
    public Expense save(Expense e){return expenses.saveAndFlush(e);}
    public PageResult<Expense> list(UUID campaign,ExpenseStatus status,Pagination p){
        String where=" where 1=1"+(campaign==null?"":" and campaign_id=:campaign")+(status==null?"":" and status=:status");
        var params=new HashMap<String,Object>();if(campaign!=null)params.put("campaign",campaign);if(status!=null)params.put("status",status.name());
        long total=jdbc.sql("select count(*) from dut_connect.campaign_expenses"+where).params(params).query(Long.class).single();
        params.put("size",p.size());params.put("offset",(long)p.page()*p.size());
        var ids=jdbc.sql("select id from dut_connect.campaign_expenses"+where+" order by created_at desc,id limit :size offset :offset").params(params).query(UUID.class).list();
        var found=expenses.findAllById(ids).stream().collect(java.util.stream.Collectors.toMap(Expense::id,e->e));
        int pages=(int)Math.min(Integer.MAX_VALUE,(total+p.size()-1)/p.size());
        return new PageResult<>(ids.stream().map(found::get).toList(),p.page(),p.size(),total,pages,p.page()+1L<pages,p.page()>0);
    }
    public BigDecimal approvedAmount(UUID campaign){return jdbc.sql("select coalesce(sum(amount),0) from dut_connect.campaign_expenses where campaign_id=:campaign and status='APPROVED'").param("campaign",campaign).query(BigDecimal.class).single();}
}
