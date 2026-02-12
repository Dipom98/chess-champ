import { MobileLayout } from '@/components/MobileLayout';
import { FileText, AlertCircle, Scale, Ban } from 'lucide-react';

export function Terms() {
    return (
        <MobileLayout title="Terms & Conditions" showBack>
            <div className="p-4 space-y-6 text-white/80">
                <div className="bg-white/5 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="text-amber-400" size={24} />
                        <h2 className="text-xl font-bold text-white">Terms of Service</h2>
                    </div>
                    <p className="text-sm leading-relaxed">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                    <p className="text-sm leading-relaxed">
                        By accessing or using Chess Master Pro, you agree to be bound by these terms of service and all applicable laws and regulations.
                    </p>
                </div>

                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Scale className="text-blue-400" size={20} />
                        <h3 className="text-lg font-bold text-white">Use License</h3>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                        <p className="text-sm leading-relaxed">
                            Permission is granted to temporarily download one copy of the materials (information or software) on Chess Master Pro for personal, non-commercial transitory viewing only.
                        </p>
                        <p className="text-sm leading-relaxed">
                            This license shall automatically terminate if you violate any of these restrictions and may be terminated by Chess Master Pro at any time.
                        </p>
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="text-red-400" size={20} />
                        <h3 className="text-lg font-bold text-white">Disclaimer</h3>
                    </div>
                    <p className="text-sm leading-relaxed bg-white/5 p-4 rounded-xl">
                        The materials on Chess Master Pro are provided on an 'as is' basis. Chess Master Pro makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                    </p>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Ban className="text-purple-400" size={20} />
                        <h3 className="text-lg font-bold text-white">Limitations</h3>
                    </div>
                    <p className="text-sm leading-relaxed bg-white/5 p-4 rounded-xl">
                        In no event shall Chess Master Pro or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Chess Master Pro.
                    </p>
                </section>
            </div>
        </MobileLayout>
    );
}
