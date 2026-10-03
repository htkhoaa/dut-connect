package vn.edu.dut.connect.organization.domain;
public enum MemberRole {
    OWNER, MANAGER, MEMBER;
    public boolean canRepresent() {
        return this==OWNER || this==MANAGER;
    }
}
