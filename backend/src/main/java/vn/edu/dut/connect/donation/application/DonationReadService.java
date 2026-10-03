package vn.edu.dut.connect.donation.application;

import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.application.CampaignAccessPort;
import vn.edu.dut.connect.identity.application.*;
import vn.edu.dut.connect.donation.domain.*;
import vn.edu.dut.connect.shared.application.*;

import static vn.edu.dut.connect.donation.application.DonationContracts.*;

@Service
@Transactional(readOnly = true)
public class DonationReadService {
    private final PaymentRepository repository;
    private final IdentityDirectoryPort identities;
    private final CampaignAccessPort campaigns;

    public DonationReadService(PaymentRepository repository, IdentityDirectoryPort identities, CampaignAccessPort campaigns) {
        this.repository = repository;
        this.identities = identities;
        this.campaigns = campaigns;
    }

    public DonationDto detail(UUID id, UUID actor) {
        var d = repository.donation(id).orElseThrow(() -> ApplicationFailure.missing("Donation not found"));
        authorize(d, actor);
        return views(new PageResult<>(List.of(d), 0, 1, 1, 1, false, false)).items().getFirst();
    }

    public PageResult<DonationDto> mine(UUID actor, Pagination page) {
        active(actor);
        return views(repository.mine(actor, page));
    }

    public PaymentDto payment(UUID id, UUID actor) {
        var p = repository.payment(id).orElseThrow(() -> ApplicationFailure.missing("Payment not found"));
        var d = repository.donation(p.donationId()).orElseThrow();
        authorize(d, actor);
        return dto(p);
    }

    public UUID donationForPayment(UUID id, UUID actor) {
        var p = payment(id, actor);
        return repository.paymentDonation(p.id()).orElseThrow();
    }

    private void authorize(Donation d, UUID actor) {
        var a = active(actor);
        if (!a.admin() && !d.donorUserId().equals(actor))
            throw new ApplicationFailure(403, "ACCESS_DENIED", "Only the donor or Admin can access this payment");
    }

    private IdentityDirectoryPort.Account active(UUID actor) {
        var a = identities.findAccount(actor).orElseThrow(() -> ApplicationFailure.missing("Account not found"));
        if (!a.active()) throw new ApplicationFailure(403, "ACCESS_DENIED", "An active account is required");
        return a;
    }

    private PageResult<DonationDto> views(PageResult<Donation> page) {
        var campaignsById = campaigns.getCampaigns(page.items().stream().map(Donation::campaignId).collect(java.util.stream.Collectors.toSet()));
        var payments = new HashMap<UUID, List<PaymentDto>>();
        repository.payments(page.items().stream().map(Donation::id).collect(java.util.stream.Collectors.toSet())).forEach(p -> payments.computeIfAbsent(p.donationId(), k -> new ArrayList<>()).add(dto(p)));
        return page.map(d -> {
            var c = campaignsById.get(d.campaignId());
            return new DonationDto(d.id(), c.id(), c.title(), c.slug(), d.amount().toPlainString(), d.status(), d.createdAt(), d.updatedAt(), d.version(), payments.getOrDefault(d.id(), List.of()));
        });
    }

    public static PaymentDto dto(PaymentTransaction p) {
        return new PaymentDto(p.id(), p.donationId(), p.amount().toPlainString(), p.provider(), p.status(), p.checkoutUrl(), p.providerOrderId(), p.providerTransactionId(), p.failureReason(), p.expiresAt(), p.paidAt(), p.version());
    }
}
