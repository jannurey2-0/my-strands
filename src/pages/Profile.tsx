import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User as UserIcon, Mail, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";

export default function Profile() {
  const { user, profile, refreshAuthState } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setLoading(false);
  }, [profile]);

  const onSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", user.id as any);

      if (error) throw error;

      toast({ title: "Profile updated", description: "Your name has been updated." });
      await refreshAuthState();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update profile.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow pt-header pt-20 md:pt-24 p-6 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Please sign in to view your profile.</CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gradient-to-br from-background via-secondary/20 to-accent/10 pt-header pt-20 md:pt-24 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
            <p className="text-muted-foreground">View and manage your account details.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Basic account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{profile?.full_name || "Unnamed"}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Role: {profile?.role ?? "student"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input id="email" value={user.email ?? ""} disabled />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Email changes require verification and are not editable here.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={onSave} disabled={saving || loading}>
                      {saving ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving
                        </span>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>To change your password, use the Forgot Password link from sign-in.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Password management will be added here in a future update.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
