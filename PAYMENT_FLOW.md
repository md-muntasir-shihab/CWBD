# PAYMENT_FLOW

## Record model (manual-first)
- userId
- examId (optional)
- amount
- currency
- method: bkash|nagad|card|bank|manual
- status: pending|paid|failed|refunded
- transactionId/reference
- proofFileUrl (optional)
- verifiedByAdminId (optional)
- createdAt/paidAt

## Flow
1. Admin creates or updates payment request -> `pending`.
2. Student submits payment reference/proof.
3. Admin verifies -> `paid`.
4. Access is unlocked automatically by eligibility checks.
5. Payment appears in admin dashboard/report/export.

## Security
- Verify callback signatures for gateway webhooks.
- Keep manual verification path always available.
