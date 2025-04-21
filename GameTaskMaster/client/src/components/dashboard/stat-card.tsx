import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: ReactNode;
  iconBgColor: string;
  title: string;
  value: number | string;
}

export default function StatCard({ icon, iconBgColor, title, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`rounded-full ${iconBgColor} p-3 mr-4`}>
            {icon}
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
