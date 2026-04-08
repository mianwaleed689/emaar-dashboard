# Post-Launch Backlog

Feature requests and ideas that come up during Sessions 0-20 go here so they do not derail the plan.

Rule: Nothing here gets built until Session 20 is complete and v1.0 is tagged.

## Backlog
(empty — add items as they come up)
## EmailJS end-to-end setup (deferred from Session 0)
The dashboard file now imports emailjs correctly, so the ReferenceError crash is fixed. However, the VITE_EMAILJS_* env vars are not set in the local .env file and their status in Cloudflare/Vercel is unconfirmed. The emailjs.send() calls will silently fail until:
1. An EmailJS account exists with a service and template
2. VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY are set in Cloudflare Pages and Vercel dashboards
3. A test signup confirms a welcome email arrives in an inbox (not spam)

Not a launch blocker for first agency — onboarding emails can be sent by hand for the first week. Revisit during Session 20 (legal/billing/launch prep) or whenever EmailJS account is ready.