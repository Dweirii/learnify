"use client";

import { useUser, UserProfile } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, AtSign, Edit, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProfileInfoCard() {
  const { user } = useUser();
  const [showClerkProfile, setShowClerkProfile] = useState(false);

  if (!user) return null;

  if (showClerkProfile) {
    return (
      <Card className="bg-transparent border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#08A84F]" />
              Edit Profile Information
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClerkProfile(false)}
              className="text-gray-400 hover:text-white border-gray-600 hover:border-gray-500"
            >
              Close
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-transparent  shadow-[0_0_10px_0_rgba(0,0,0,0.6)] rounded-lg p-6 border-none transition-all duration-300">
            <div className="mb-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-2 h-2 bg-[#08A84F] rounded-full"></div>
              <span>Editing your profile information</span>
            </div>
              <p className="text-xs text-gray-400 mt-1">
                Changes will be saved automatically and synced across your account
              </p>
            </div>
            <UserProfile 
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-none bg-transparent",
                  headerTitle: "text-white",
                  headerSubtitle: "text-gray-400",
                  formFieldLabel: "text-gray-300",
                  formFieldInput: "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#08A84F] focus:ring-[#08A84F]/20",
                  formFieldInputShowPasswordButton: "text-gray-400 hover:text-white",
                  formFieldSuccessText: "text-[#08A84F]",
                  formFieldErrorText: "text-red-400",
                  formButtonPrimary: "bg-[#08A84F] hover:bg-[#08A84F]/90 text-white border-none",
                  formButtonSecondary: "bg-gray-700 hover:bg-gray-600 text-white border-gray-600",
                  identityPreviewText: "text-gray-300",
                  identityPreviewEditButton: "text-[#08A84F] hover:text-[#08A84F]/80",
                  navbarButton: "text-gray-400 hover:text-white",
                  navbarButtonActive: "text-[#08A84F]",
                  navbarMobileMenuButton: "text-gray-400 hover:text-white",
                  navbarMobileMenuButtonActive: "text-[#08A84F]",
                  navbarMobileMenuButtonActiveBackground: "bg-[#08A84F]/10",
                  profileSectionTitle: "text-white",
                  profileSectionContent: "text-gray-300",
                  profileSectionPrimaryButton: "bg-[#08A84F] hover:bg-[#08A84F]/90 text-white",
                  profileSectionSecondaryButton: "bg-gray-700 hover:bg-gray-600 text-white border-gray-600",
                  profileSectionDangerButton: "bg-red-600 hover:bg-red-700 text-white",
                  avatarBox: "border-gray-600",
                  avatarImageActionsUpload: "bg-[#08A84F] hover:bg-[#08A84F]/90 text-white",
                  avatarImageActionsRemove: "bg-red-600 hover:bg-red-700 text-white",
                  avatarImageActionsChange: "bg-gray-700 hover:bg-gray-600 text-white border-gray-600",
                  fileDropAreaBox: "border-gray-600 bg-gray-700/50",
                  fileDropAreaBoxActive: "border-[#08A84F] bg-[#08A84F]/10",
                  fileDropAreaIcon: "text-gray-400",
                  fileDropAreaText: "text-gray-300",
                  fileDropAreaTextActive: "text-[#08A84F]",
                  dividerLine: "bg-gray-700",
                  dividerText: "text-gray-400",
                  formResendCodeLink: "text-[#08A84F] hover:text-[#08A84F]/80",
                  otpCodeFieldInput: "bg-gray-700 border-gray-600 text-white focus:border-[#08A84F] focus:ring-[#08A84F]/20",
                  phoneInputBox: "bg-gray-700 border-gray-600 text-white",
                  phoneInputBoxFocus: "border-[#08A84F] ring-[#08A84F]/20",
                  selectButton: "bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                  selectOptions: "bg-gray-800 border-gray-600",
                  selectOption: "text-gray-300 hover:bg-gray-700",
                  selectOptionActive: "bg-[#08A84F]/20 text-[#08A84F]",
                  modalCloseButton: "text-gray-400 hover:text-white",
                  modalContent: "bg-gray-800 border-gray-700",
                  modalHeaderTitle: "text-white",
                  modalHeaderSubtitle: "text-gray-400",
                  alertText: "text-gray-300",
                  alertError: "bg-red-900/20 border-red-500/30 text-red-400",
                  alertSuccess: "bg-[#08A84F]/20 border-[#08A84F]/30 text-[#08A84F]",
                  alertWarning: "bg-yellow-900/20 border-yellow-500/30 text-yellow-400",
                  alertInfo: "bg-blue-900/20 border-blue-500/30 text-blue-400",
                },
                variables: {
                  colorPrimary: "#08A84F",
                  colorBackground: "#1f2937",
                  colorInputBackground: "#374151",
                  colorInputText: "#ffffff",
                  colorText: "#ffffff",
                  colorTextSecondary: "#9ca3af",
                  borderRadius: "0.5rem",
                  fontFamily: "inherit",
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-transparent  shadow-[0_0_10px_0_rgba(0,0,0,0.6)] border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <User className="w-5 h-5 text-[#0BA84E]" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Picture */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-transparent">
            {user.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User className="w-8 h-8" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-400">Profile Picture</p>
            <p className="text-xs text-gray-500">Managed by Clerk</p>
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AtSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Username</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{user.username}</span>
            <Badge variant="secondary" className="text-xs">
              Read-only
            </Badge>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Display Name</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.firstName || "Not set"
              }
            </span>
            <Badge variant="secondary" className="text-xs">
              Read-only
            </Badge>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Email</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">
              {user.emailAddresses[0]?.emailAddress || "Not set"}
            </span>
            <Badge variant="secondary" className="text-xs">
              Read-only
            </Badge>
          </div>
        </div>

        {/* Edit Button */}
        <div className="pt-4 border-t  shadow-[0_0_10px_0_rgba(0,0,0,0.6)] ">
          <Button
            onClick={() => setShowClerkProfile(true)}
            className="w-full bg-gradient-to-r from-[#08A84F] to-[#08A84F]/90 hover:from-[#08A84F]/90 hover:to-[#08A84F]/80 text-white transition-all duration-200 shadow-lg shadow-[#08A84F]/20 hover:shadow-[#08A84F]/30"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile Information
          </Button>
          <div className="mt-3 p-3 bg-transparent  shadow-[0_0_10px_0_rgba(0,0,0,0.6)] rounded-lg border-none">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-[#08A84F] rounded-full mt-1.5"></div>
              <div>
                <p className="text-xs text-gray-300 font-medium">What you can edit:</p>
                <ul className="text-xs text-gray-400 mt-1 space-y-0.5">
                  <li>• Username and display name</li>
                  <li>• Email address and verification</li>
                  <li>• Profile picture upload</li>
                  <li>• Password and security settings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
