import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

export default function Charts() {
  const { t } = useLanguage();
  
  const { data: statistics, isLoading } = useQuery({
    queryKey: ["/api/statistics"],
  });

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("dashboard.projectStatistics")}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <p>{t("app.loading")}</p>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  // Transform task category data for pie chart
  const categoryData = Object.entries(statistics.tasksByCategory).map(([category, count]) => ({
    name: t(`tasks.categories.${category}`),
    value: count,
    color: getCategoryColor(category),
  }));

  // Transform task completion data for bar chart
  const completionData = Object.entries(statistics.tasksByDay).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    count: count,
  }));

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t("dashboard.projectStatistics")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Task Completion Chart */}
          <div>
            <h4 className="text-md font-medium mb-4 text-gray-700 dark:text-gray-300">
              {t("dashboard.taskCompletion")}
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionData}>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Task Categories Chart */}
          <div>
            <h4 className="text-md font-medium mb-4 text-gray-700 dark:text-gray-300">
              {t("dashboard.taskCategories")}
            </h4>
            <div className="h-64 flex flex-col justify-between">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                {categoryData.map((category, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span>{category.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "programming":
      return "var(--primary)";
    case "design":
      return "#FF5722";
    case "audio":
      return "#00BFA5";
    case "marketing":
      return "#FFC107";
    default:
      return "#9E9E9E";
  }
}
