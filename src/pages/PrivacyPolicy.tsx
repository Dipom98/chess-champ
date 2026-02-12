import { MobileLayout } from '@/components/MobileLayout';
import { Shield, Lock, Eye, Database, Mail } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <MobileLayout title="Privacy Policy" showBack>
      <div className="p-4 space-y-6 text-white/80">
        <div className="bg-white/5 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-amber-400" size={24} />
            <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
          </div>
          <p className="text-sm leading-relaxed">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-sm leading-relaxed">
            Your privacy is important to us. It is Chess Master Pro's policy to respect your privacy regarding any information we may collect from you across our application.
          </p>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="text-blue-400" size={20} />
            <h3 className="text-lg font-bold text-white">Information Collection</h3>
          </div>
          <p className="text-sm leading-relaxed bg-white/5 p-4 rounded-xl">
            We do not collect any personal information. All game data, including your profile, game history, and settings, are stored locally on your device. We do not transmit this data to any external servers.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="text-green-400" size={20} />
            <h3 className="text-lg font-bold text-white">Data Security</h3>
          </div>
          <p className="text-sm leading-relaxed bg-white/5 p-4 rounded-xl">
            Since we do not collect or store your personal data on our servers, there is no risk of your data being breached from our end. Your data security is entirely dependent on the security of your own device.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="text-purple-400" size={20} />
            <h3 className="text-lg font-bold text-white">Third-Party Services</h3>
          </div>
          <p className="text-sm leading-relaxed bg-white/5 p-4 rounded-xl">
            We do not use any third-party tracking or analytics services that collect personal identifiable information.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="text-red-400" size={20} />
            <h3 className="text-lg font-bold text-white">Contact Us</h3>
          </div>
          <div className="bg-white/5 p-4 rounded-xl">
            <p className="text-sm leading-relaxed mb-2">
              If you have any questions about our privacy policy, please contact us at:
            </p>
            <a href="mailto:Support@Dipomdutta.com" className="text-amber-400 font-bold hover:underline">
              Support@Dipomdutta.com
            </a>
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}
