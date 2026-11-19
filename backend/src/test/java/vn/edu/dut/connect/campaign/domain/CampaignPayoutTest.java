package vn.edu.dut.connect.campaign.domain;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CampaignPayoutTest {
    @Test void cannotConfirmTwice() {
        var campaign = new Campaign();
        campaign.confirmPayout(new BigDecimal("20000"), null, null, "Bank transfer");
        assertEquals("PAID_OUT", campaign.payoutStatus());
        assertThrows(CampaignViolation.class, () -> campaign.confirmPayout(new BigDecimal("20000"), null, null, "Again"));
    }

    @Test void rejectsInvalidAmounts() {
        for (String amount : new String[]{"0", "-100", "100.5", "100000000000000000000", "1e1000000"}) {
            assertThrows(CampaignViolation.class, () -> new Campaign().confirmPayout(new BigDecimal(amount), null, null, null));
        }
    }
}
