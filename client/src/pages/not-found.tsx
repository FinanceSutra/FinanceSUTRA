import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <Card className="w-full max-w-md mx-4 border border-gray-200 shadow-sm rounded-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center mb-6">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <h1 className="text-xl font-medium text-gray-900">404 Page Not Found</h1>
            <p className="mt-2 text-sm text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex justify-center">
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
