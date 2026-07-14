# Security Specification: Financial Ledger & Casino System

This specification defines the critical invariants, safety gates, and adversarial attack vectors ("Dirty Dozen") for the Lucky Panda Premium Gaming platform's Firestore database.

## 1. Data Invariants

1. **Owner-Immune Balances**: A regular user is NEVER permitted to write, increment, or decrement their own `balance` or `bonusBalance` directly. Balance adjustments must occur strictly via admin approval or server-controlled atomic triggers.
2. **Immutability of Ledgers**: Once a record in `transactions` or `bets` is written, it is strictly immutable. No modifications (updates or deletions) are allowed by any client.
3. **Privilege Isolation**: No user can self-promote their `role` (e.g., from `user` to `admin` or `support`).
4. **Verified Execution**: High-trust transactions require a verified email state (`request.auth.token.email_verified == true`).
5. **Credit-Rated Safety Gates**: Cashouts/withdrawals require credit rating inspection before manual admin clearance.
6. **Iframe & Single-Session Integrity**: Requests must validate standard character and size constraints to prevent resource bloating attacks.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent targeted attacks attempting to bypass identity verification, escalate privileges, or corrupt the financial ledgers. All of them must return `PERMISSION_DENIED` during rule evaluation.

### Case 1: Self-Crediting Balance Attack (Balance Spoofing)
* **Target Collection**: `/users/{userId}`
* **Attack Vector**: Authenticated user attempts to directly increment their own balance.
* **Payload**:
```json
{
  "id": "USER_123",
  "username": "attacker",
  "balance": 99999.00,
  "bonusBalance": 1000.00,
  "role": "user"
}
```
* **Expected Result**: `PERMISSION_DENIED` (Direct balance updates forbidden for non-admins).

### Case 2: Privilege Escalation (Role Spoofing)
* **Target Collection**: `/users/{userId}`
* **Attack Vector**: Normal user attempts to update their user profile document to set `role: "admin"`.
* **Payload**:
```json
{
  "role": "admin"
}
```
* **Expected Result**: `PERMISSION_DENIED` (Role can only be modified by admins).

### Case 3: Ledger Alteration (Historical Fraud)
* **Target Collection**: `/transactions/{transactionId}`
* **Attack Vector**: Attacker attempts to update a completed withdrawal transaction to change the amount or status toCompleted.
* **Payload**:
```json
{
  "amount": 10.00,
  "status": "completed"
}
```
* **Expected Result**: `PERMISSION_DENIED` (Historical transactions are immutable).

### Case 4: Stealth Request Approval (Audit Bypass)
* **Target Collection**: `/requests/{requestId}`
* **Attack Vector**: Attacker attempts to directly update a pending withdrawal request to `status: "approved"` without an admin credential.
* **Payload**:
```json
{
  "status": "approved",
  "approvedBy": "USER_123"
}
```
* **Expected Result**: `PERMISSION_DENIED` (Status updates on requests require `isAdmin()` clearance).

### Case 5: Rogue Bank Account Linkage (Identity Hijack)
* **Target Collection**: `/bankAccounts/{accountId}`
* **Attack Vector**: Attacker attempts to link a bank account on behalf of another user ID.
* **Payload**:
```json
{
  "id": "BANK_999",
  "userId": "VICTIM_USER_456",
  "bankName": "Rogue Bank",
  "accountHolder": "Attacker Name",
  "accountNumber": "987654321",
  "routingCode": "123456"
}
```
* **Expected Result**: `PERMISSION_DENIED` (UserId in BankAccount document must match the authenticating caller UID).

### Case 6: Negative Wager Injection (Refund Fraud)
* **Target Collection**: `/bets/{betId}`
* **Attack Vector**: Attacker attempts to inject a gameplay bet with a negative `betAmount` to artificially inflate their funds.
* **Payload**:
```json
{
  "id": "BET_恶意",
  "gameId": "mines",
  "gameName": "Mines",
  "userId": "USER_123",
  "username": "attacker",
  "betAmount": -1000.00,
  "winAmount": 0,
  "multiplier": 0,
  "status": "loss",
  "date": "2026-07-08T02:00:00.000Z"
}
```
* **Expected Result**: `PERMISSION_DENIED` (Wager amounts must be positive numbers).

### Case 7: Fake Announcement Injection (Malicious Phishing)
* **Target Collection**: `/announcements/{announcementId}`
* **Attack Vector**: Attacker attempts to write a global alert redirecting players to a phishing site.
* **Payload**:
```json
{
  "id": "ANN_999",
  "title": "SYSTEM MAINTENANCE",
  "content": "Please login at malicious-link.com to preserve your balances.",
  "type": "announcement",
  "isActive": true,
  "date": "2026-07-08T02:00:00.000Z"
}
```
* **Expected Result**: `PERMISSION_DENIED` (Only admins can write or modify announcements).

### Case 8: Support Ticket Spoofing (Social Engineering)
* **Target Collection**: `/tickets/{ticketId}`
* **Attack Vector**: Attacker attempts to modify a support ticket owned by another user to close it or read chat details.
* **Payload**:
```json
{
  "userId": "VICTIM_USER_456",
  "status": "resolved"
}
```
* **Expected Result**: `PERMISSION_DENIED` (Non-admin users can only view or write tickets where `userId == request.auth.uid`).

### Case 9: Game Lock Override (Casino Manipulation)
* **Target Collection**: `/games/{gameId}`
* **Attack Vector**: Attacker attempts to unlock a deactivated or locked high-RTP game.
* **Payload**:
```json
{
  "isLocked": false,
  "rtp": 99.9
}
```
* **Expected Result**: `PERMISSION_DENIED` (Game parameters can only be altered by `isAdmin()`).

### Case 10: Resource Exhaustion (ID Character Poisoning)
* **Target Collection**: `/requests/{requestId}`
* **Attack Vector**: Attacker attempts to inject a 2KB junk string as the request document ID to corrupt query indexing.
* **Payload Document ID**: `A_JUNK_STRING_OF_OVER_1000_CHARACTERS_FOR_DENIAL_OF_WALLET...`
* **Expected Result**: `PERMISSION_DENIED` (All document IDs must conform to strict matches('^[a-zA-Z0-9_\\-]+$') and length bounds).

### Case 11: Unverified Email Cashout Request
* **Target Collection**: `/requests/{requestId}`
* **Attack Vector**: User with `email_verified == false` attempts to file a withdrawal request.
* **Payload**:
```json
{
  "id": "REQ_777",
  "userId": "USER_123",
  "username": "unverified_user",
  "type": "withdrawal",
  "amount": 200.00,
  "status": "pending",
  "reference": "WD_112233",
  "gateway": "Crypto",
  "date": "2026-07-08T02:00:00.000Z"
}
```
* **Expected Result**: `PERMISSION_DENIED` (Withdrawals require verified email token state).

### Case 12: Historical Ledger Theft (Broad Database Scraping)
* **Target Collection**: `/transactions`
* **Attack Vector**: Attacker attempts a broad query for all transactions across the entire gaming platform (blanket list query).
* **Payload Query**: `db.collection('transactions').get()`
* **Expected Result**: `PERMISSION_DENIED` (List rules require queries to be strictly filtered to `resource.data.userId == request.auth.uid` or executed by an admin).
