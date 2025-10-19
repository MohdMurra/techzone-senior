import { Navbar } from "@/components/Navbar";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-12 flex-1 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Introduction</h2>
            <p>
              At TechZone, we respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you 
              visit our website and tell you about your privacy rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Information We Collect</h2>
            <p className="mb-2">We may collect, use, store and transfer different kinds of personal data about you:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Identity Data (name, username)</li>
              <li>Contact Data (email address, phone number, shipping address)</li>
              <li>Transaction Data (payment details, purchase history)</li>
              <li>Technical Data (IP address, browser type, device information)</li>
              <li>Usage Data (how you use our website and services)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">How We Use Your Information</h2>
            <p className="mb-2">We use your personal data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>To process and deliver your orders</li>
              <li>To manage your account and provide customer support</li>
              <li>To improve our website and services</li>
              <li>To send you marketing communications (with your consent)</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Data Security</h2>
            <p>
              We have implemented appropriate security measures to prevent your personal data from being 
              accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal 
              data to those employees and partners who have a business need to know.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us 
              at privacy@techzone.com
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
