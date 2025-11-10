import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { assessmentService } from '@/integrations/supabase/assessmentService';
import type { Tables } from '@/integrations/supabase/types';
import { 
  Settings, 
  Cpu, 
  School, 
  Briefcase, 
  BarChart3, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

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
      const maintenanceMessage = setting?.maintenance_message || 
        (isMLModelSetting(pageName) ? 'ML Model is currently disabled' : 'Currently Under Development');
      
      toast({
        title: "Updating Settings",
        description: isMLModelSetting(pageName) ? 
          `Setting ${getPageDisplayName(pageName)} to ${isUnderMaintenance ? 'enabled' : 'disabled'}...` :
          `Setting ${getPageDisplayName(pageName)} to ${isUnderMaintenance ? 'maintenance mode' : 'active'}...`
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
        description: isMLModelSetting(pageName) ? 
          `ML Model ${isUnderMaintenance ? 'enabled' : 'disabled'} for students` :
          `Maintenance mode ${isUnderMaintenance ? 'enabled' : 'disabled'} for ${getPageDisplayName(pageName)} page`
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
        description: `Updating ${isMLModelSetting(pageName) ? 'status message' : 'maintenance message'} for ${getPageDisplayName(pageName)}...`
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
        description: `${isMLModelSetting(pageName) ? 'Status message' : 'Maintenance message'} updated for ${getPageDisplayName(pageName)} page`
      });
    } catch (error) {
      console.error('Error updating system setting:', error);
      toast({
        title: "Error",
        description: `Failed to update ${isMLModelSetting(pageName) ? 'status message' : 'maintenance message'} for ${getPageDisplayName(pageName)}: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getPageDisplayInfo = (pageName: string) => {
    const displayInfoMap: Record<string, { name: string; icon: React.ReactNode }> = {
      'schools': { name: 'Schools', icon: <School className="h-4 w-4" /> },
      'careers': { name: 'Careers', icon: <Briefcase className="h-4 w-4" /> },
      'results': { name: 'Results', icon: <BarChart3 className="h-4 w-4" /> },
      'assessment': { name: 'Assessment', icon: <FileText className="h-4 w-4" /> },
      'ml_model': { name: 'ML Model', icon: <Cpu className="h-4 w-4" /> }
    };
    return displayInfoMap[pageName] || { name: pageName, icon: <Settings className="h-4 w-4" /> };
  };

  const getPageDisplayName = (pageName: string) => {
    return getPageDisplayInfo(pageName).name;
  };

  const getPageIcon = (pageName: string) => {
    return getPageDisplayInfo(pageName).icon;
  };

  // Group settings by category
  const getSettingCategory = (pageName: string) => {
    if (isMLModelSetting(pageName)) return 'ml';
    return 'general';
  };

  const settingCategories = [
    { id: 'general', name: 'General Pages', description: 'Student-facing pages that can be put in maintenance mode' },
    { id: 'ml', name: 'Machine Learning', description: 'ML model configuration and settings' }
  ];

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
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" />
          System Settings
        </h1>
        <p className="text-muted-foreground">Manage system-wide settings and maintenance modes</p>
      </div>

      {/* Settings Categories */}
      {settingCategories.map(category => {
        const categorySettings = settings.filter(setting => getSettingCategory(setting.page_name) === category.id);
        
        if (categorySettings.length === 0) return null;
        
        return (
          <Card key={category.id} className="hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.id === 'ml' ? <Cpu className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
                {category.name}
              </CardTitle>
              <CardDescription>
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categorySettings.map((setting) => (
                <div 
                  key={setting.page_name} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg transition-colors duration-200 ${
                    isMLModelSetting(setting.page_name) ? 
                      (setting.is_under_maintenance ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200') : 
                      (setting.is_under_maintenance ? 'bg-yellow-50/50 border-yellow-200' : 'hover:bg-muted/30')
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getPageIcon(setting.page_name)}
                      <h3 className="font-medium text-foreground">{getPageDisplayName(setting.page_name)}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      {isMLModelSetting(setting.page_name) ? (
                        <>
                          {setting.is_under_maintenance ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>Enabled for students</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-red-500" />
                              <span>Disabled for students</span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {setting.is_under_maintenance ? (
                            <>
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              <span>Currently under maintenance</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>Available to students</span>
                            </>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`maintenance-${setting.page_name}`}
                        checked={isMLModelSetting(setting.page_name) ? setting.is_under_maintenance : setting.is_under_maintenance}
                        onCheckedChange={(checked) => handleToggleMaintenance(setting.page_name, checked)}
                        disabled={saving}
                        className={isMLModelSetting(setting.page_name) ? 
                          (setting.is_under_maintenance ? "data-[state=checked]:bg-green-500" : "data-[state=unchecked]:bg-red-500") : 
                          (setting.is_under_maintenance ? "data-[state=checked]:bg-yellow-500" : "")}
                      />
                      <Label htmlFor={`maintenance-${setting.page_name}`}>
                        {isMLModelSetting(setting.page_name) ? (
                          setting.is_under_maintenance ? (
                            <span className="flex items-center gap-1 text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              Enabled
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-700">
                              <XCircle className="h-3 w-3" />
                              Disabled
                            </span>
                          )
                        ) : (
                          setting.is_under_maintenance ? (
                            <span className="flex items-center gap-1 text-yellow-700">
                              <AlertTriangle className="h-3 w-3" />
                              Under Maintenance
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </span>
                          )
                        )}
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
                        variant="outline"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            General system configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-foreground">Total Pages Managed</h4>
              <p className="text-2xl font-bold text-primary mt-2">{settings.length}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-foreground">Pages Under Maintenance</h4>
              <p className="text-2xl font-bold text-primary mt-2">
                {settings.filter(s => s.is_under_maintenance && !isMLModelSetting(s.page_name)).length}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-foreground">ML Models Enabled</h4>
              <p className="text-2xl font-bold text-primary mt-2">
                {settings.filter(s => s.is_under_maintenance && isMLModelSetting(s.page_name)).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}