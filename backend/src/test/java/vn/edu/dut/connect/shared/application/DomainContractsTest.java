package vn.edu.dut.connect.shared.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.edu.dut.connect.campaign.application.CampaignContracts;
import vn.edu.dut.connect.campaign.domain.CampaignContent;
import vn.edu.dut.connect.campaign.domain.ContentInput;
import vn.edu.dut.connect.campaign.domain.ContributionMode;
import vn.edu.dut.connect.campaign.domain.OrganizerType;
import vn.edu.dut.connect.donation.application.DonationContracts;
import vn.edu.dut.connect.identity.application.IdentityContracts;
import vn.edu.dut.connect.organization.application.OrganizationContracts;
import vn.edu.dut.connect.volunteer.application.VolunteerContracts;
import vn.edu.dut.connect.volunteer.domain.VolunteerTrack;

import static org.assertj.core.api.Assertions.assertThat;

class DomainContractsTest {

    @Test
    @DisplayName("CampaignContracts ContentDto correctly maps domain content model")
    void campaignContentDtoMapsCorrectly() {
        ContentInput input = new ContentInput(
                OrganizerType.ORGANIZATION,
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Chiến dịch Mùa Hè Xanh 2026",
                "Tóm tắt chiến dịch",
                "Mô tả chi tiết chiến dịch tình nguyện hè",
                "Giúp đỡ 500 hộ gia đình khó khăn",
                ContributionMode.HYBRID,
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 7, 30),
                Instant.parse("2026-06-25T00:00:00Z"),
                Instant.parse("2026-07-15T00:00:00Z"),
                50, 20, 30,
                "Sinh viên DUT có sức khỏe tốt",
                new BigDecimal("50000000"),
                new BigDecimal("10000000"),
                "Nhà tài trợ A",
                new BigDecimal("15000000"),
                new BigDecimal("75000000")
        );
        CampaignContent content = new CampaignContent(input);
        CampaignContracts.ContentDto dto = CampaignContracts.ContentDto.from(content);

        assertThat(dto).isNotNull();
        assertThat(dto.title()).isEqualTo("Chiến dịch Mùa Hè Xanh 2026");
        assertThat(dto.organizerType()).isEqualTo(OrganizerType.ORGANIZATION);
        assertThat(dto.contributionMode()).isEqualTo(ContributionMode.HYBRID);
        assertThat(dto.targetVolunteerCount()).isEqualTo(50);
        assertThat(dto.fundraisingGoal()).isEqualTo("50000000");
    }

    @Test
    @DisplayName("DonationContracts exposes compliant donation request record")
    void donationContractsRecordsExist() {
        DonationContracts.CreateRequest donateReq = new DonationContracts.CreateRequest(new BigDecimal("100000"));

        assertThat(donateReq.amount()).isEqualByComparingTo("100000");
    }

    @Test
    @DisplayName("IdentityContracts LoginRequest matches authentication schema")
    void identityContractsLoginRequestCompliant() {
        IdentityContracts.LoginRequest request = new IdentityContracts.LoginRequest("student@sv.dut.udn.vn", "P@ssword123");

        assertThat(request.email()).isEqualTo("student@sv.dut.udn.vn");
        assertThat(request.password()).isEqualTo("P@ssword123");
    }

    @Test
    @DisplayName("OrganizationContracts and VolunteerContracts expose required domain records")
    void organizationAndVolunteerContractsCompliant() {
        UUID typeId = UUID.randomUUID();
        OrganizationContracts.CreateRequest createReq = new OrganizationContracts.CreateRequest(
                "CLB Tin Học Sinh Viên",
                typeId,
                "CLB học thuật khoa CNTT"
        );

        assertThat(createReq.name()).isEqualTo("CLB Tin Học Sinh Viên");
        assertThat(createReq.organizationTypeId()).isEqualTo(typeId);

        VolunteerContracts.ApplyRequest applyRequest = new VolunteerContracts.ApplyRequest(
                VolunteerTrack.TECHNICAL,
                "Em có kinh nghiệm lập trình Java và thiết kế web",
                "Rảnh tất cả các buổi chiều cuối tuần"
        );

        assertThat(applyRequest.preferredTrack()).isEqualTo(VolunteerTrack.TECHNICAL);
        assertThat(applyRequest.motivation()).contains("lập trình Java");
    }
}
