package vn.edu.dut.connect.donation.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PaymentReconciliationScheduler {
    private static final Logger log = LoggerFactory.getLogger(PaymentReconciliationScheduler.class);
    private final PaymentGateways gateways;
    private final PaymentTransactions transactions;
    private final JdbcClient jdbc;

    public PaymentReconciliationScheduler(PaymentGateways gateways, PaymentTransactions transactions, JdbcClient jdbc) {
        this.gateways = gateways;
        this.transactions = transactions;
        this.jdbc = jdbc;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("Running initial PayOS payment reconciliation on startup...");
        reconcilePendingPayments();
    }

    @Scheduled(fixedDelay = 4000)
    public void reconcilePendingPayments() {
        try {
            List<String> pendingOrders = jdbc.sql("""
                select provider_order_id from dut_connect.payment_transactions
                where provider = 'payos' and status in ('CREATED', 'PROVIDER_PENDING')
                and created_at > now() - interval '24 hours'
                order by created_at desc limit 10
            """).query(String.class).list();

            if (pendingOrders.isEmpty()) return;

            var payos = gateways.get("payos");
            for (String orderId : pendingOrders) {
                try {
                    var result = payos.query(orderId);
                    if (result.outcome() == PaymentGateway.Outcome.PAID) {
                        log.info("Auto-reconciled PayOS payment orderId={} outcome=PAID", orderId);
                        transactions.settle(result);
                    } else if (result.outcome() == PaymentGateway.Outcome.CANCELLED) {
                        log.info("Auto-reconciled PayOS payment orderId={} outcome=CANCELLED", orderId);
                        transactions.settle(result);
                    }
                } catch (Exception e) {
                    log.debug("Auto-reconcile check failed for orderId={}: {}", orderId, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.debug("Payment reconciliation job error: {}", e.getMessage());
        }
    }
}
