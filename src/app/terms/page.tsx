import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Dropcue",
  description: "The terms governing use of the Dropcue digital-product platform.",
};

export default function TermsPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl px-6 py-20">
      <article className="prose prose-slate max-w-none">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Legal</p>
        <h1>Terms of Service</h1>
        <p className="lead">Last updated: September 15, 2026</p>

        <p>
          These Terms govern your use of Dropcue. By creating an account or using the service, you
          agree to these Terms and our Privacy Policy.
        </p>

        <h2>Using Dropcue</h2>
        <p>
          You must provide accurate information, keep your account secure, and use Dropcue only in
          compliance with applicable law. You are responsible for activity performed through your account.
        </p>

        <h2>Creator content</h2>
        <p>
          You retain ownership of products and files you upload. You grant Dropcue the limited
          license needed to host, process, display, transmit, and deliver that content to operate
          the service. You must own or have permission to sell and distribute every file you upload.
        </p>

        <h2>Prohibited content and conduct</h2>
        <p>
          Do not use Dropcue for unlawful, fraudulent, infringing, malicious, abusive, deceptive,
          or harmful activity. Do not upload malware, content that violates another person&apos;s
          rights, or material that you are not authorized to distribute. We may suspend or remove
          content that violates these Terms or creates security, legal, or operational risk.
        </p>

        <h2>Payments, refunds, and delivery</h2>
        <p>
          Payments are processed by the configured payment provider and are subject to that
          provider&apos;s terms. Dropcue is not the payment processor. Products are delivered only after
          the payment provider&apos;s webhook has been verified. Download links are temporary and may
          expire for security reasons. Creators are responsible for accurately describing products,
          honoring applicable refund obligations, and responding to buyer issues.
        </p>

        <h2>Fees</h2>
        <p>
          Any platform or payment-provider fees applicable to a transaction are shown or described
          before use where required. Providers may charge their own fees under their terms.
        </p>

        <h2>Intellectual property</h2>
        <p>
          Dropcue&apos;s software, branding, design, and service materials remain the property of
          Dropcue or its licensors. You may not copy, reverse engineer, resell, or misuse them except
          as permitted by law.
        </p>

        <h2>Availability and changes</h2>
        <p>
          We work to keep Dropcue available, but the service may change or be temporarily unavailable
          for maintenance, provider outages, security events, or circumstances outside our control.
          We may update these Terms as the service changes and will publish the updated version here.
        </p>

        <h2>Disclaimers and limitation of liability</h2>
        <p>
          To the extent permitted by law, Dropcue is provided without warranties beyond those that
          cannot legally be excluded. We are not responsible for indirect, incidental, special, or
          consequential losses, or for content, payment-provider actions, or outages outside our control.
        </p>

        <h2>Termination</h2>
        <p>
          You may stop using Dropcue at any time. We may suspend or terminate access for violations
          of these Terms, security threats, legal requirements, or operational reasons. Provisions
          that should survive termination continue to apply.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these Terms can be sent to <a href="mailto:legal@dropcue.com">legal@dropcue.com</a>.
        </p>
      </article>
    </main>
  );
}
