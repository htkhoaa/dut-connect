package vn.edu.dut.connect.donation.infrastructure.persistence;

import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.donation.application.DonationFundingPort;

@Repository
@Transactional(readOnly=true)
public class DonationFunding implements DonationFundingPort {
    private final JdbcClient jdbc;
    public DonationFunding(JdbcClient jdbc) { this.jdbc=jdbc; }
    public Map<UUID,Funding> paidFunding(Set<UUID> campaigns) {
        if(campaigns.isEmpty()) return Map.of();
        var result=new HashMap<UUID,Funding>();
        jdbc.sql("select campaign_id,sum(amount) amount,count(*) count from dut_connect.donations where campaign_id in (:ids) and status='PAID' group by campaign_id")
            .param("ids",campaigns).query((rs,n)-> {
                result.put(rs.getObject("campaign_id",UUID.class),new Funding(rs.getBigDecimal("amount"),rs.getLong("count")));
                return true;
            }).list();
        return Map.copyOf(result);
    }
}
