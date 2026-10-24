import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Camera, CreditCard, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getInitials, getSubscriptionBadge, type SubscriptionStatus } from "@/lib/dashboardPresentation";

type DashboardSettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DashboardSettingsModal({ open, onOpenChange }: DashboardSettingsModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const { data: profile } = trpc.profile.getProfile.useQuery(undefined, { enabled: open });
  const { data: subscription } = trpc.subscription.getStatus.useQuery(undefined, { enabled: open });
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = trpc.profile.uploadProfileImage.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.profile.getProfile.invalidate(), utils.activity.list.invalidate()]);
      toast.success("Profile picture updated.");
      setUploading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Unable to update profile picture.");
      setUploading(false);
    },
  });

  const removeAvatar = trpc.profile.removeProfileImage.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.profile.getProfile.invalidate(), utils.activity.list.invalidate()]);
      toast.success("Profile picture removed.");
    },
    onError: () => toast.error("Unable to remove profile picture."),
  });

  const openPortal = trpc.subscription.createPortal.useMutation({
    onSuccess: async (result) => {
      await utils.activity.list.invalidate();
      window.open(result.url, "_blank", "noopener,noreferrer");
    },
    onError: (error) => toast.error(error.message || "Subscription settings are unavailable."),
  });

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Profile images must be 4 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const dataBase64 = result.split(",")[1];
      if (!dataBase64) return toast.error("Unable to read this image.");
      setUploading(true);
      uploadAvatar.mutate({ fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", dataBase64 });
    };
    reader.readAsDataURL(file);
  };

  const status: SubscriptionStatus =
    subscription?.status === "active" || subscription?.status === "canceled" || subscription?.status === "past_due"
      ? subscription.status
      : "free";
  const badge = subscription?.isOwner
    ? { label: "Owner", tone: "sage" as const }
    : getSubscriptionBadge(status, subscription?.plan);
  const hasSubscription = Boolean(subscription?.shopifyCustomerId || subscription?.stripeCustomerId);
  const hasShopifySubscription = Boolean(subscription?.shopifyCustomerId);
  const hasLegacyStripeSubscription = Boolean(subscription?.stripeCustomerId && !hasShopifySubscription);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-[#E6E0D6] bg-[#FDFBF7] p-0 shadow-2xl">
        <DialogHeader className="border-b border-[#ECE6DD] bg-[radial-gradient(circle_at_top_right,rgba(126,154,133,0.16),transparent_48%)] px-6 pb-5 pt-6">
          <DialogTitle className="font-serif text-2xl text-[#2C2A29]">Account settings</DialogTitle>
          <DialogDescription className="text-[#716C65]">Update your profile picture and manage your plan securely.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5">
          <section className="flex items-center gap-4" aria-label="Profile picture settings">
            <Avatar className="h-16 w-16 border-2 border-white shadow-[0_8px_20px_rgba(76,92,80,0.16)]">
              {profile?.profileImageUrl && <AvatarImage src={profile.profileImageUrl} alt={`${profile.name || "Patient"} profile`} />}
              <AvatarFallback className="bg-[#7E9A85]/15 font-serif text-lg font-bold text-[#5F7B67]">
                {getInitials(profile?.name, profile?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#302D2A]">{profile?.name || "Patient"}</p>
              <p className="mt-0.5 text-xs text-[#817B73]">JPG, PNG, or WebP · up to 4 MB</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" className="h-8 rounded-lg bg-[#6F8C76] text-xs hover:bg-[#5E7965]" disabled={uploading} onClick={() => inputRef.current?.click()}>
                  {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-1.5 h-3.5 w-3.5" />}
                  Change photo
                </Button>
                {profile?.profileImageUrl && (
                  <Button size="sm" variant="ghost" className="h-8 rounded-lg px-2.5 text-xs text-[#A05E4D] hover:bg-[#F5E8E3] hover:text-[#8C4D3E]" disabled={removeAvatar.isPending} onClick={() => removeAvatar.mutate()}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                  </Button>
                )}
              </div>
            </div>
            <input ref={inputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleFile(event.target.files?.[0])} />
          </section>

          <section className="rounded-2xl border border-[#E8E1D7] bg-white/80 p-4" aria-label="Subscription settings">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-[#302D2A]"><CreditCard className="h-4 w-4 text-[#6F8C76]" /> Subscription</p>
                <p className="mt-1 text-xs leading-relaxed text-[#817B73]">Manage billing and plan changes securely through Stripe.</p>
              </div>
              <Badge className="shrink-0 border border-[#7E9A85]/25 bg-[#7E9A85]/10 text-[10px] font-bold uppercase tracking-wide text-[#5F7B67]">{badge.label}</Badge>
            </div>
            <Button className="mt-4 h-9 w-full rounded-xl bg-[#2F3E34] text-xs font-semibold hover:bg-[#233128]" onClick={() => hasLegacyStripeSubscription ? openPortal.mutate({ origin: window.location.origin }) : (window.location.href = "/pricing")} disabled={openPortal.isPending}>
              {openPortal.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
              {hasShopifySubscription ? "Review Shopify billing" : hasSubscription ? "Manage subscription" : "Explore plans"}
            </Button>
          </section>
        </div>

        <DialogFooter className="border-t border-[#ECE6DD] px-6 py-4 sm:justify-end">
          <Button variant="ghost" className="rounded-xl text-sm text-[#6B665F]" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
