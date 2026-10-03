package vn.edu.dut.connect.identity.application;

public interface GoogleIdentityVerifier {
    record Identity(String subject, String email, String fullName) {}
    String clientId();
    Identity verify(String credential, String nonce);
}
