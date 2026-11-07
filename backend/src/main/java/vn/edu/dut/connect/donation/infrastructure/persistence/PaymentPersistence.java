package vn.edu.dut.connect.donation.infrastructure.persistence;

import java.util.*;

import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.simple.JdbcClient;
import vn.edu.dut.connect.donation.domain.*;
import vn.edu.dut.connect.donation.application.PaymentRepository;
import vn.edu.dut.connect.identity.application.Pagination;
import vn.edu.dut.connect.shared.application.PageResult;

@Repository
public class PaymentPersistence implements PaymentRepository {
    private final JpaDonationRepository donations;
    private final JpaPaymentRepository payments;
    private final JdbcClient jdbc;

    public PaymentPersistence(JpaDonationRepository donations, JpaPaymentRepository payments, JdbcClient jdbc) {
        this.donations = donations;
        this.payments = payments;
        this.jdbc = jdbc;
    }

    public Donation saveDonation(Donation d) {
        return donations.saveAndFlush(d);
    }

    public PaymentTransaction savePayment(PaymentTransaction p) {
        return payments.saveAndFlush(p);
    }

    public Optional<Donation> donation(UUID id) {
        return donations.findById(id);
    }

    public Optional<Donation> lockDonation(UUID id) {
        return donations.lock(id);
    }

    public Optional<PaymentTransaction> payment(UUID id) {
        return payments.findById(id);
    }

    public Optional<UUID> paymentDonation(UUID id) {
        return jdbc.sql("select donation_id from dut_connect.payment_transactions where id=:id").param("id", id).query(UUID.class).optional();
    }

    public Optional<PaymentTransaction> lockPayment(UUID id) {
        return payments.lock(id);
    }

    public Optional<UUID> paymentByOrder(String provider, String order) {
        if (order == null || order.isBlank()) return Optional.empty();
        String trimmedOrder = order.trim();

        // 1. Direct match on provider_order_id
        var direct = jdbc.sql("""
            select id from dut_connect.payment_transactions
            where provider = :provider and provider_order_id = :order
            order by created_at desc limit 1
        """).param("provider", provider).param("order", trimmedOrder).query(UUID.class).optional();
        if (direct.isPresent()) return direct;

        // 2. Prefix or substring match
        var pattern = jdbc.sql("""
            select id from dut_connect.payment_transactions
            where provider = :provider and (provider_order_id like :likeOrder or :order like concat('%', provider_order_id, '%'))
            order by created_at desc limit 1
        """).param("provider", provider)
            .param("order", trimmedOrder)
            .param("likeOrder", trimmedOrder + "%")
            .query(UUID.class).optional();
        if (pattern.isPresent()) return pattern;

        // 3. Match numeric order code
        try {
            long numOrder = Long.parseLong(trimmedOrder);
            if (numOrder > 0) {
                var byNum = jdbc.sql("""
                    select id from dut_connect.payment_transactions
                    where provider = :provider and payos_order_code = :numOrder
                    order by created_at desc limit 1
                """).param("provider", provider).param("numOrder", numOrder).query(UUID.class).optional();
                if (byNum.isPresent()) return byNum;
            }
        } catch (NumberFormatException ignored) {}

        // 4. Fallback match by donation_id if order is a UUID
        try {
            UUID donationUuid = UUID.fromString(trimmedOrder);
            return jdbc.sql("""
                select id from dut_connect.payment_transactions
                where provider = :provider and donation_id = :donationUuid
                order by created_at desc limit 1
            """).param("provider", provider).param("donationUuid", donationUuid).query(UUID.class).optional();
        } catch (IllegalArgumentException ignored) {
            return Optional.empty();
        }
    }

    public List<PaymentTransaction> payments(Set<UUID> ids) {
        return ids.isEmpty() ? List.of() : payments.findByDonationIdInOrderByCreatedAtDescIdAsc(ids);
    }

    public PageResult<Donation> mine(UUID user, Pagination p) {
        long total = jdbc.sql("select count(*) from dut_connect.donations where donor_user_id=:user").param("user", user).query(Long.class).single();
        var ids = jdbc.sql("select id from dut_connect.donations where donor_user_id=:user order by created_at desc,id limit :size offset :offset").param("user", user).param("size", p.size()).param("offset", (long) p.page() * p.size()).query(UUID.class).list();
        var found = donations.findAllById(ids).stream().collect(java.util.stream.Collectors.toMap(Donation::id, d -> d));
        int pages = (int) Math.min(Integer.MAX_VALUE, (total + p.size() - 1) / p.size());
        return new PageResult<>(ids.stream().map(found::get).toList(), p.page(), p.size(), total, pages, p.page() + 1L < pages, p.page() > 0);
    }
}
