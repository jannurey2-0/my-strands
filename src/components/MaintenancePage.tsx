import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface MaintenancePageProps {
  message?: string;
}

export const MaintenancePage = ({ message = 'This page is currently under maintenance.' }: MaintenancePageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-2xl">Under Maintenance</CardTitle>
          <CardDescription>
            We're currently working on this page to make it better for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            {message}
          </p>
          <div className="text-sm text-muted-foreground">
            Please check back later. Thank you for your patience!
          </div>
        </CardContent>
      </Card>
    </div>
  );
};