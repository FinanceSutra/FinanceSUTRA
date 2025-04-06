import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  User,
  Lock,
  Bell,
  Monitor,
  Globe,
  Database,
  CloudOff,
  Save,
  RefreshCw,
  FileKey,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import { queryClient, apiRequest } from '@/lib/queryClient';

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  
  // User settings state
  const [profileFormData, setProfileFormData] = useState({
    fullName: '',
    email: '',
    username: '',
  });
  
  const [securityFormData, setSecurityFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Application settings
  const [settings, setSettings] = useState({
    // Notification preferences
    emailNotifications: true,
    tradingAlerts: true,
    marketUpdates: false,
    performanceReports: true,
    
    // Application preferences
    theme: 'light',
    chartStyle: 'candles',
    defaultTimeframe: '1d',
    autoRefreshData: true,
    showTradingVolume: true,
    
    // Data preferences
    cacheHistoricalData: true,
    downloadFrequency: 'daily',
    dataRetentionPeriod: '90d',
  });
  
  // Fetch user data
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['/api/user'],
  });
  
  // Update profile data when user data is loaded
  React.useEffect(() => {
    if (user) {
      setProfileFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        username: user.username || '',
      });
    }
  }, [user]);
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', '/api/user/profile', data);
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', '/api/user/password', data);
    },
    onSuccess: () => {
      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully',
      });
      setSecurityFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error) => {
      toast({
        title: 'Password change failed',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', '/api/user/settings', data);
    },
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Your application settings have been updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Handle profile form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileFormData);
  };
  
  // Handle profile input changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle security form submission
  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (securityFormData.newPassword !== securityFormData.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'New password and confirmation do not match',
        variant: 'destructive',
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: securityFormData.currentPassword,
      newPassword: securityFormData.newPassword,
    });
  };
  
  // Handle security input changes
  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle settings changes
  const handleSettingChange = (name: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle save settings
  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };
  
  // Handle API key request
  const handleRequestApiKey = () => {
    toast({
      title: 'API Key Requested',
      description: 'Your API key request is being processed. You will receive it via email.',
    });
  };
  
  if (loadingUser) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
      <Header
        title="Settings"
        description="Manage your account and application settings"
      />
      
      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Lock className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center">
            <Monitor className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center">
            <FileKey className="mr-2 h-4 w-4" />
            API Access
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <form onSubmit={handleProfileSubmit}>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and public profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={profileFormData.fullName}
                    onChange={handleProfileChange}
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileFormData.email}
                    onChange={handleProfileChange}
                    placeholder="john@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={profileFormData.username}
                    onChange={handleProfileChange}
                    placeholder="johndoe"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View and manage your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Account Type</p>
                  <p className="text-sm">{user?.plan === 'pro' ? 'Pro' : 'Free'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Account Status</p>
                  <p className="text-sm">{user?.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Member Since</p>
                  <p className="text-sm">{new Date(user?.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Last Login</p>
                  <p className="text-sm">Today, 2:30 PM</p>
                </div>
              </div>
              
              <Separator />
              
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Danger Zone</AlertTitle>
                <AlertDescription>
                  Deleting your account is permanent and cannot be undone.
                </AlertDescription>
              </Alert>
              
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="text-danger hover:text-danger">
                Delete Account
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <Card>
            <form onSubmit={handleSecuritySubmit}>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={securityFormData.currentPassword}
                    onChange={handleSecurityChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={securityFormData.newPassword}
                    onChange={handleSecurityChange}
                    required
                  />
                  <p className="text-xs text-neutral-500">
                    Password must be at least 8 characters and include numbers and special characters.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={securityFormData.confirmPassword}
                    onChange={handleSecurityChange}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-neutral-500">
                    Require a verification code when logging in
                  </p>
                </div>
                <Switch 
                  checked={false}
                  onCheckedChange={() => {
                    toast({
                      title: "Feature not available",
                      description: "Two-factor authentication will be available soon.",
                    });
                  }}
                />
              </div>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Enhance Your Security</AlertTitle>
                <AlertDescription>
                  We strongly recommend enabling two-factor authentication for additional account security.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage devices where you're currently logged in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-neutral-500">
                      Windows • Chrome • New York, USA
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Started: Today, 2:30 PM
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" disabled>
                    Current
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Mobile Device</p>
                    <p className="text-sm text-neutral-500">
                      iOS • Safari • San Francisco, USA
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Started: Yesterday, 5:15 PM
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Revoke
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="text-danger hover:text-danger">
                Logout of All Devices
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Email Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-neutral-500">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="trading-alerts">Trading Alerts</Label>
                    <p className="text-sm text-neutral-500">
                      Receive alerts for trade executions and signals
                    </p>
                  </div>
                  <Switch
                    id="trading-alerts"
                    checked={settings.tradingAlerts}
                    onCheckedChange={(checked) => handleSettingChange('tradingAlerts', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="market-updates">Market Updates</Label>
                    <p className="text-sm text-neutral-500">
                      Receive updates on market events and news
                    </p>
                  </div>
                  <Switch
                    id="market-updates"
                    checked={settings.marketUpdates}
                    onCheckedChange={(checked) => handleSettingChange('marketUpdates', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="performance-reports">Performance Reports</Label>
                    <p className="text-sm text-neutral-500">
                      Receive weekly and monthly performance reports
                    </p>
                  </div>
                  <Switch
                    id="performance-reports"
                    checked={settings.performanceReports}
                    onCheckedChange={(checked) => handleSettingChange('performanceReports', checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>
                Customize your trading platform experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Display Settings</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value) => handleSettingChange('theme', value)}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="chart-style">Chart Style</Label>
                    <Select
                      value={settings.chartStyle}
                      onValueChange={(value) => handleSettingChange('chartStyle', value)}
                    >
                      <SelectTrigger id="chart-style">
                        <SelectValue placeholder="Select chart style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="candles">Candlesticks</SelectItem>
                        <SelectItem value="line">Line</SelectItem>
                        <SelectItem value="bars">Bars</SelectItem>
                        <SelectItem value="area">Area</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-volume">Show Trading Volume</Label>
                      <p className="text-sm text-neutral-500">
                        Display volume indicators on charts
                      </p>
                    </div>
                    <Switch
                      id="show-volume"
                      checked={settings.showTradingVolume}
                      onCheckedChange={(checked) => handleSettingChange('showTradingVolume', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Trading Settings</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-timeframe">Default Timeframe</Label>
                    <Select
                      value={settings.defaultTimeframe}
                      onValueChange={(value) => handleSettingChange('defaultTimeframe', value)}
                    >
                      <SelectTrigger id="default-timeframe">
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1m">1 Minute</SelectItem>
                        <SelectItem value="5m">5 Minutes</SelectItem>
                        <SelectItem value="15m">15 Minutes</SelectItem>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="4h">4 Hours</SelectItem>
                        <SelectItem value="1d">1 Day</SelectItem>
                        <SelectItem value="1w">1 Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-refresh">Auto-Refresh Data</Label>
                      <p className="text-sm text-neutral-500">
                        Automatically refresh market data
                      </p>
                    </div>
                    <Switch
                      id="auto-refresh"
                      checked={settings.autoRefreshData}
                      onCheckedChange={(checked) => handleSettingChange('autoRefreshData', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Data Management</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="cache-data">Cache Historical Data</Label>
                    <p className="text-sm text-neutral-500">
                      Store historical data locally for faster access
                    </p>
                  </div>
                  <Switch
                    id="cache-data"
                    checked={settings.cacheHistoricalData}
                    onCheckedChange={(checked) => handleSettingChange('cacheHistoricalData', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="download-frequency">Data Download Frequency</Label>
                  <Select
                    value={settings.downloadFrequency}
                    onValueChange={(value) => handleSettingChange('downloadFrequency', value)}
                  >
                    <SelectTrigger id="download-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data-retention">Data Retention Period</Label>
                  <Select
                    value={settings.dataRetentionPeriod}
                    onValueChange={(value) => handleSettingChange('dataRetentionPeriod', value)}
                  >
                    <SelectTrigger id="data-retention">
                      <SelectValue placeholder="Select retention period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30d">30 days</SelectItem>
                      <SelectItem value="90d">90 days</SelectItem>
                      <SelectItem value="180d">180 days</SelectItem>
                      <SelectItem value="365d">1 year</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Cache cleared",
                        description: "All local data has been successfully cleared",
                      });
                    }}
                  >
                    <CloudOff className="h-4 w-4 mr-2" />
                    Clear Local Cache
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>
                Manage API keys for programmatic access to the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.plan === 'pro' ? (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>API Access Available</AlertTitle>
                    <AlertDescription>
                      As a Pro subscriber, you have access to our API. Generate your API key to get started.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Your API Keys</h3>
                    <div className="text-center py-4">
                      <p className="text-neutral-500">No API keys generated yet</p>
                    </div>
                    <Button onClick={handleRequestApiKey} className="mt-2">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate API Key
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">API Documentation</h3>
                    <p className="text-sm text-neutral-500">
                      Reference our comprehensive API documentation to integrate the platform with your systems.
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <Button variant="outline">
                        <Globe className="mr-2 h-4 w-4" />
                        View Documentation
                      </Button>
                      <Button variant="outline">
                        <Database className="mr-2 h-4 w-4" />
                        API Reference
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-neutral-100 mb-4">
                    <Lock className="h-6 w-6 text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900">API Access Restricted</h3>
                  <p className="mt-2 text-neutral-500">
                    API access is available exclusively for Pro subscribers
                  </p>
                  <Button className="mt-4">
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
