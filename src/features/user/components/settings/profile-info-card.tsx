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
      <Card className="bg-transparent shadow-[0_0_10px_0_rgba(0,0,0,0.6)] border-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#0FA84E]" />
              Edit Profile Information
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClerkProfile(false)}
              className="text-gray-400 hover:text-white border-gray-600 hover:border-gray-500 shadow-sm rounded-sm"
            >
              Close
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-transparent  rounded-lg p-6 border-none transition-all duration-300">
            <div className="mb-4 p-3 bg-gray-700/30 rounded-lg  border-none">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-2 h-2 bg-[#0FA84E] rounded-full"></div>
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
                  formFieldInput: "bg-[#1E2228] border-gray-600 text-white placeholder-gray-400 focus:border-[#0FA84E] focus:ring-[#0FA84E]/20",
                  formFieldInputShowPasswordButton: "text-gray-400 hover:text-white",
                  formFieldSuccessText: "text-[#0FA84E]",
                  formFieldErrorText: "text-red-400",
                  formButtonPrimary: "bg-[#0FA84E] hover:bg-[#0FA84E]/90 text-white border-none",
                  identityPreviewText: "text-gray-300",
                  identityPreviewEditButton: "text-[#0FA84E] hover:text-[#0FA84E]/80",
                  navbarButton: "text-gray-400 hover:text-white",
                  navbarButtonActive: "text-[#0FA84E]",
                  navbarMobileMenuButton: "text-gray-400 hover:text-white",
                  navbarMobileMenuButtonActive: "text-[#0FA84E]",
                  navbarMobileMenuButtonActiveBackground: "bg-[#0FA84E]/10",
                  profileSectionTitle: "text-white",
                  profileSectionContent: "text-gray-300",
                  profileSectionPrimaryButton: "bg-[#0FA84E] hover:bg-[#0FA84E]/90 text-white",
                  profileSectionSecondaryButton: "bg-[#1E2228] hover:bg-[#141517] text-white border-gray-600",
                  profileSectionDangerButton: "bg-red-600 hover:bg-red-700 text-white",
                  avatarBox: "border-gray-600",
                  avatarImageActionsUpload: "bg-[#0FA84E] hover:bg-[#0FA84E]/90 text-white",
                  avatarImageActionsRemove: "bg-red-600 hover:bg-red-700 text-white",
                  avatarImageActionsChange: "bg-[#1E2228] hover:bg-[#141517] text-white border-gray-600",
                  fileDropAreaBox: "border-gray-600 bg-[#1E2228]",
                  fileDropAreaBoxActive: "border-[#0FA84E] bg-[#0FA84E]/10",
                  fileDropAreaIcon: "text-gray-400",
                  fileDropAreaText: "text-gray-300",
                  fileDropAreaTextActive: "text-[#0FA84E]",
                  dividerLine: "bg-gray-700",
                  dividerText: "text-gray-400",
                  formResendCodeLink: "text-[#0FA84E] hover:text-[#0FA84E]/80",
                  otpCodeFieldInput: "bg-[#1E2228] border-gray-600 text-white focus:border-[#0FA84E] focus:ring-[#0FA84E]/20",
                  phoneInputBox: "bg-[#1E2228] border-gray-600 text-white",
                  phoneInputBoxFocus: "border-[#0FA84E] ring-[#0FA84E]/20",
                  selectButton: "bg-[#1E2228] border-gray-600 text-white hover:bg-[#141517]",
                  selectOptions: "bg-[#1E2228] border-gray-600",
                  selectOption: "text-gray-300 hover:bg-[#141517]",
                  selectOptionActive: "bg-[#0FA84E]/20 text-[#0FA84E]",
                  modalCloseButton: "text-gray-400 hover:text-white",
                  modalContent: "bg-[#1E2228] border-gray-700",
                  modalHeaderTitle: "text-white",
                  modalHeaderSubtitle: "text-gray-400",
                  alertText: "text-gray-300",
                  alertError: "bg-red-900/20 border-red-500/30 text-red-400",
                  alertSuccess: "bg-[#0FA84E]/20 border-[#0FA84E]/30 text-[#0FA84E]",
                  alertWarning: "bg-yellow-900/20 border-yellow-500/30 text-yellow-400",
                  alertInfo: "bg-blue-900/20 border-blue-500/30 text-blue-400",
                  footerActionText: "text-gray-400",
                  footerActionLink: "text-[#0FA84E] hover:text-[#0FA84E]/80",
                  footerPagesLink: "text-gray-400 hover:text-white",
                  footerPagesLinkActive: "text-[#0FA84E]",
                  socialButtonsBlockButton: "bg-[#1E2228] hover:bg-[#141517] text-white border-gray-600",
                  socialButtonsBlockButtonText: "text-white",
                  socialButtonsBlockButtonArrow: "text-gray-400",
                  socialButtonsBlockButtonIcon: "text-gray-400",
                  socialButtonsProviderIcon: "text-gray-400",
                  socialButtonsProviderIcon__github: "text-gray-400",
                  socialButtonsProviderIcon__google: "text-gray-400",
                  socialButtonsProviderIcon__microsoft: "text-gray-400",
                  socialButtonsProviderIcon__apple: "text-gray-400",
                  socialButtonsProviderIcon__facebook: "text-gray-400",
                  socialButtonsProviderIcon__twitter: "text-gray-400",
                  socialButtonsProviderIcon__discord: "text-gray-400",
                  socialButtonsProviderIcon__twitch: "text-gray-400",
                  socialButtonsProviderIcon__steam: "text-gray-400",
                  socialButtonsProviderIcon__linkedin: "text-gray-400",
                  socialButtonsProviderIcon__instagram: "text-gray-400",
                  socialButtonsProviderIcon__snapchat: "text-gray-400",
                  socialButtonsProviderIcon__tiktok: "text-gray-400",
                  socialButtonsProviderIcon__youtube: "text-gray-400",
                  socialButtonsProviderIcon__spotify: "text-gray-400",
                  socialButtonsProviderIcon__reddit: "text-gray-400",

                },
                variables: {
                  colorPrimary: "#0FA84E",
                  colorBackground: "#141517",
                  colorInputBackground: "#1E2228",
                  colorInputText: "#ffffff",
                  colorText: "#ffffff",
                  colorTextSecondary: "#9ca3af",
                  borderRadius: "0.5rem",
                  fontFamily: "inherit",
                  colorNeutral: "#1E2228",
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
          <User className="w-5 h-5 text-[#0FA84E]" />
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
            <p className="text-xs text-gray-500">Click edit to update</p>
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
        <div className="pt-4 flex justify-end">
          <Button
            onClick={() => setShowClerkProfile(true)}
            className="bg-[#0FA84E] hover:bg-[#0FA84E]/90 text-white transition-all duration-200 px-4 py-2 rounded-sm font-medium"
          >
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
