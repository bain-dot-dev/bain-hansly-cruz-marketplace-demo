import { ProfileForm } from "@/components/profile/profile-form";
import { StripeConnectSection } from "@/components/profile/stripe-connect-section";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Profile Settings
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your personal information and payment settings
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ProfileForm />
              <StripeConnectSection />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
