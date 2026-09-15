import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Dropcue",
  description: "How Dropcue collects, uses, stores, and protects personal information.",
};

export default function PrivacyPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl px-6 py-20">
      <article className="prose prose-slate max-w-none">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Legal</p>
        <h1>Privacy Policy</h1>
        <p className="lead">Last updated: September 15, 2026</p>

        <p>
          Dropcue helps creators sell digital products. This policy explains what personal
          information we collect, why we use it, how we share it, and the choices available to you.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account information:</strong> email address, authentication details, and profile information.</li>
          <li><strong>Creator information:</strong> product names, descriptions, prices, uploaded file metadata, and payout-provider information.</li>
          <li><strong>Buyer information:</strong> email address, order details, payment status, and delivery activity.</li>
          <li><strong>Support information:</strong> feedback, messages, and the page from which feedback was submitted.</li>
          <li><strong>Technical information:</strong> security logs, request metadata, and rate-limit identifiers used to operate and protect the service.</li>
        </ul>

        <h2>How we use information</h2>
        <ul>
          <li>Provide authentication, storefronts, checkout, order tracking, and file delivery.</li>
          <li>Process payments and verify payment-provider webhooks.</li>
          <li>Send transactional messages such as purchase and authentication emails.</li>
          <li>Prevent fraud, abuse, unauthorized access, and excessive requests.</li>
          <li>Respond to support requests and improve the service.</li>
          <li>Comply with legal obligations and enforce our terms.</li>
        </ul>

        <h2>Service providers</h2>
        <p>
          We use carefully selected providers to operate Dropcue, including Supabase for database,
          authentication, and private storage; payment providers such as Bachs.io and optionally
          Stripe; Resend for transactional email; and Upstash Redis for distributed rate limiting.
          These providers process information only as needed to provide their services and under
          their own privacy policies.
        </p>

        <h2>Files and private delivery</h2>
        <p>
          Creator files are stored in private storage. We do not make them publicly browsable.
          After a verified purchase, a time-limited signed download URL is generated. Do not upload
          content you do not have the right to distribute.
        </p>

        <h2>Cookies and local storage</h2>
        <p>
          Essential authentication cookies are used to keep accounts signed in and secure. The
          application may use local storage for non-sensitive interface preferences such as
          onboarding progress. We do not use non-essential advertising cookies. If that changes,
          we will request consent where required before enabling them.
        </p>

        <h2>Retention and deletion</h2>
        <p>
          We retain information only for as long as needed to provide the service, meet legal and
          financial obligations, resolve disputes, prevent abuse, and maintain security records.
          You may request account or personal-data deletion by contacting us, subject to records we
          must retain by law.
        </p>

        <h2>Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, delete, restrict, or
          object to processing of your information, and to request portability. Contact us to make
          a request. You may also have the right to lodge a complaint with your local data-protection
          authority.
        </p>

        <h2>Security</h2>
        <p>
          We use access controls, row-level authorization, private storage, signed URLs, webhook
          verification, audit logging, HTTPS, and rate limiting. No online service can guarantee
          absolute security, so protect your credentials and notify us promptly about suspected abuse.
        </p>

        <h2>Children</h2>
        <p>Dropcue is not intended for children under 13, and we do not knowingly collect their information.</p>

        <h2>Contact</h2>
        <p>
          For privacy questions or requests, contact <a href="mailto:privacy@dropcue.com">privacy@dropcue.com</a>.
        </p>
      </article>
    </main>
  );
}
