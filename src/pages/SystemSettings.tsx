import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { assessmentService } from '@/integrations/supabase/assessmentService';
import type { Tables } from '@/integrations/supabase/types';

interface SystemSetting extends Tables<'system_settings'> {}

export default function SystemSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch system settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await assessmentService.getSystemSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleMaintenance = async (pageName: string, isUnderMaintenance: boolean) => {
    try {
      setSaving(true);
      const setting = settings.find(s => s.page_name === pageName);
      const maintenanceMessage = setting?.maintenance_message || 'Currently Under Development';
      
      toast({
        title: "Updating Settings",
        description: `Setting ${getPageDisplayName(pageName)} to ${isUnderMaintenance ? 'maintenance mode' : 'active'}...`
      });
      
      await assessmentService.updateSystemSetting(pageName, isUnderMaintenance, maintenanceMessage);
      
      // Update local state
      setSettings(prev => prev.map(setting => 
        setting.page_name === pageName 
          ? { ...setting, is_under_maintenance: isUnderMaintenance } 
          : setting
      ));
      
      toast({
        title: "Success",
        description: `Maintenance mode ${isUnderMaintenance ? 'enabled' : 'disabled'} for ${getPageDisplayName(pageName)} page`
      });
    } catch (error) {
      console.error('Error updating system setting:', error);
      toast({
        title: "Error",
        description: `Failed to update system setting for ${getPageDisplayName(pageName)}: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMessage = async (pageName: string, message: string) => {
    try {
      setSaving(true);
      const setting = settings.find(s => s.page_name === pageName);
      const isUnderMaintenance = setting?.is_under_maintenance || false;
      
      toast({
        title: "Updating Message",
        description: `Updating maintenance message for ${getPageDisplayName(pageName)}...`
      });
      
      await assessmentService.updateSystemSetting(pageName, isUnderMaintenance, message);
      
      // Update local state
      setSettings(prev => prev.map(setting => 
        setting.page_name === pageName 
          ? { ...setting, maintenance_message: message } 
          : setting
      ));
      
      toast({
        title: "Success",
        description: `Maintenance message updated for ${getPageDisplayName(pageName)} page`
      });
    } catch (error) {
      console.error('Error updating system setting:', error);
      toast({
        title: "Error",
        description: `Failed to update maintenance message for ${getPageDisplayName(pageName)}: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getPageDisplayName = (pageName: string) => {
    const displayNameMap: Record<string, string> = {
      'schools': 'Schools',
      'careers': 'Careers',
      'results': 'Results',
      'assessment': 'Assessment',
      'ml_model': 'ML Model'
    };
    return displayNameMap[pageName] || pageName;
  };

  const isMLModelSetting = (pageName: string) => {
    return pageName === 'ml_model';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">Manage system-wide settings and maintenance modes</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">Loading settings...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Manage system-wide settings and maintenance modes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page Maintenance Settings</CardTitle>
          <CardDescription>
            Toggle maintenance mode for student-facing pages. When enabled, users will see a maintenance message instead of the page content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings
            .filter(setting => !isMLModelSetting(setting.page_name)) // Filter out ML model settings for separate handling
            .map((setting) => (
              <div key={setting.page_name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{getPageDisplayName(setting.page_name)}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {setting.is_under_maintenance 
                      ? "Currently under maintenance" 
                      : "Available to students"}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`maintenance-${setting.page_name}`}
                      checked={setting.is_under_maintenance}
                      onCheckedChange={(checked) => handleToggleMaintenance(setting.page_name, checked)}
                      disabled={saving}
                    />
                    <Label htmlFor={`maintenance-${setting.page_name}`}>
                      {setting.is_under_maintenance ? "Under Maintenance" : "Active"}
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      value={setting.maintenance_message || ''}
                      onChange={(e) => handleUpdateMessage(setting.page_name, e.target.value)}
                      placeholder="Maintenance message"
                      className="w-64"
                      disabled={saving}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateMessage(setting.page_name, setting.maintenance_message || '')}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* ML Model Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>ML Model Settings</CardTitle>
          <CardDescription>
            Control the machine learning model used for strand recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings
            .filter(setting => isMLModelSetting(setting.page_name))
            .map((setting) => (
              <div key={setting.page_name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{getPageDisplayName(setting.page_name)}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {setting.is_under_maintenance 
                      ? "ML model enabled for strand recommendations" 
                      : "ML model disabled, using rule-based system"}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`maintenance-${setting.page_name}`}
                      checked={setting.is_under_maintenance}
                      onCheckedChange={(checked) => handleToggleMaintenance(setting.page_name, checked)}
                      disabled={saving}
                    />
                    <Label htmlFor={`maintenance-${setting.page_name}`}>
                      {setting.is_under_maintenance ? "Enabled" : "Disabled"}
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      value={setting.maintenance_message || ''}
                      onChange={(e) => handleUpdateMessage(setting.page_name, e.target.value)}
                      placeholder="Status message"
                      className="w-64"
                      disabled={saving}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateMessage(setting.page_name, setting.maintenance_message || '')}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          
          {settings.filter(setting => isMLModelSetting(setting.page_name)).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              ML model settings not found. Please ensure the database migration has been applied.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            General system configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-foreground">Total Pages Managed</h4>
              <p className="text-2xl font-bold text-primary mt-2">{settings.length}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-foreground">Pages Under Maintenance</h4>
              <p className="text-2xl font-bold text-primary mt-2">
                {settings.filter(s => s.is_under_maintenance).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}