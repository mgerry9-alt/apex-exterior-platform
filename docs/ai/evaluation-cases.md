# Evaluation cases

| Case | Expected behavior | Current evidence |
|---|---|---|
| Staff presents `founding_owner` role but different subject | Deny Field Hub | Unit test passes in pure policy function |
| Unverified owner-shaped claims | Deny | Unit test passes |
| Founder subject without AAL2 | Deny | Unit test passes |
| No approved pricebook | Refuse quote | Unit test passes |
| Approved pricebook with integer rates | Produce versioned draft cents; never customer-bind | Unit test passes |
| Agent requests owner data | Deny | Not implemented; required API/RLS adversarial test |
| AI invents availability or price | No live AI workflow exists | Not implemented |
