import { Navbar } from "@/components/Navbar";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-12 flex-1 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Agreement to Terms</h2>
            <p>
              By accessing and using TechZone's website and services, you accept and agree to be bound by 
              the terms and provisions of this agreement. If you do not agree to these terms, please do not 
              use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Use of Service</h2>
            <p className="mb-2">You agree to use our service only for lawful purposes. You must not use our service:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>In any way that violates any applicable local, national, or international law</li>
              <li>To transmit any unauthorized advertising or promotional material</li>
              <li>To impersonate or attempt to impersonate TechZone or any other person</li>
              <li>To engage in any conduct that restricts or inhibits anyone's use of the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Product Information</h2>
            <p>
              We strive to provide accurate product descriptions and pricing. However, we do not warrant 
              that product descriptions, pricing, or other content is accurate, complete, reliable, current, 
              or error-free. We reserve the right to correct any errors or inaccuracies and to change or 
              update information at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Orders and Payment</h2>
            <p className="mb-2">By placing an order, you agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide accurate and complete purchase information</li>
              <li>Pay all charges incurred at the prices in effect when the charges were incurred</li>
              <li>Accept that we may refuse or cancel any order for any reason</li>
              <li>Acknowledge that prices and availability are subject to change without notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Returns and Refunds</h2>
            <p>
              Please refer to our Returns Policy for detailed information about returns, exchanges, and 
              refunds. Generally, products may be returned within 30 days of purchase in their original 
              condition with all accessories and packaging.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, TechZone shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues, 
              whether incurred directly or indirectly, or any loss of data, use, goodwill, or other 
              intangible losses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of the jurisdiction 
              in which TechZone operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any material 
              changes by posting the new terms on this page. Your continued use of the service after such 
              modifications constitutes your acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at support@techzone.com
            </p>
          </section>

          <p className="text-sm pt-6 border-t">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
