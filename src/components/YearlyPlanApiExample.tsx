import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp, Users, Calendar } from "lucide-react";

// Interface matching your API response structure
interface YearlyPlanDetail {
  month: number;
  sales_plan: string;
  clients_plan: string;
  sales_count_plan: string;
  sales: number;
  clients: number;
  sales_count: number;
  sales_percentage: number;
  clients_percentage: number;
  sales_count_percentage: number;
}

interface YearlyPlanApiResponse {
  id: number;
  user: number;
  year: number;
  details: YearlyPlanDetail[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YearlyPlanApiExample: React.FC = () => {
  const [yearlyPlanData, setYearlyPlanData] =
    useState<YearlyPlanApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample data matching your exact structure
  const sampleApiResponse: YearlyPlanApiResponse = {
    id: 4,
    user: 1,
    year: 2025,
    details: [
      {
        month: 1,
        sales_plan: "1000.00",
        clients_plan: "50.00",
        sales_count_plan: "200.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      },
      {
        month: 2,
        sales_plan: "1200.00",
        clients_plan: "55.00",
        sales_count_plan: "210.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      },
      {
        month: 3,
        sales_plan: "1300.00",
        clients_plan: "60.00",
        sales_count_plan: "220.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      },
      {
        month: 4,
        sales_plan: "1400.00",
        clients_plan: "65.00",
        sales_count_plan: "230.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      },
      {
        month: 5,
        sales_plan: "1500.00",
        clients_plan: "70.00",
        sales_count_plan: "240.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      },
      {
        month: 6,
        sales_plan: "1600.00",
        clients_plan: "75.00",
        sales_count_plan: "250.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      },
      {
        month: 7,
        sales_plan: "1700.00",
        clients_plan: "80.00",
        sales_count_plan: "260.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      },
      {
        month: 8,
        sales_plan: "1800.00",
        clients_plan: "85.00",
        sales_count_plan: "270.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      },
      {
        month: 9,
        sales_plan: "1900.00",
        clients_plan: "90.00",
        sales_count_plan: "280.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      },
      {
        month: 10,
        sales_plan: "2000.00",
        clients_plan: "95.00",
        sales_count_plan: "290.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      },
      {
        month: 11,
        sales_plan: "2100.00",
        clients_plan: "100.00",
        sales_count_plan: "300.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      },
      {
        month: 12,
        sales_plan: "2200.00",
        clients_plan: "105.00",
        sales_count_plan: "310.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      },
    ],
  };

  useEffect(() => {
    // Function to fetch data from API
    const fetchYearlyPlanData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Replace with your actual API call
        // const response = await fetch(`${BASE_URL}/api/yearly-plans/`);
        // const data = await response.json();

        // For demo purposes, simulate API call with sample data
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setYearlyPlanData(sampleApiResponse);
      } catch (err) {
        setError("Failed to fetch yearly plan data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchYearlyPlanData();
  }, []);

  // Manual refresh function
  const refreshData = async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setYearlyPlanData(sampleApiResponse);
    } catch (err) {
      setError("Failed to fetch yearly plan data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get sales plan value for a specific month
  const getSalesPlanForMonth = (month: number): string => {
    if (!yearlyPlanData) return "0";
    const monthDetail = yearlyPlanData.details.find(
      (detail) => detail.month === month,
    );
    return monthDetail ? monthDetail.sales_plan : "0";
  };

  // Calculate total annual sales plan
  const totalAnnualSalesPlan =
    yearlyPlanData?.details.reduce(
      (total, detail) => total + parseFloat(detail.sales_plan),
      0,
    ) || 0;

  // Calculate average monthly sales plan
  const averageMonthlySalesPlan = totalAnnualSalesPlan / 12;

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading yearly plan data...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refreshData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!yearlyPlanData) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No yearly plan data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Yearly Sales Plan Dashboard
          </h1>
          <p className="text-gray-600">
            User {yearlyPlanData.user} - {yearlyPlanData.year} Sales Plan
            Analysis
          </p>
        </div>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                Total Annual Plan
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ${totalAnnualSalesPlan.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">
                Average Monthly
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              ${averageMonthlySalesPlan.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">
                Plan Year
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {yearlyPlanData.year}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Plan Table - 12 Month Headers */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Sales Plan Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {MONTH_NAMES.map((month, index) => (
                    <TableHead key={index} className="text-center min-w-24">
                      {month.substring(0, 3)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {Array.from({ length: 12 }, (_, index) => {
                    const value = getSalesPlanForMonth(index + 1);
                    const numValue = parseFloat(value);
                    const isHighValue = numValue > averageMonthlySalesPlan;

                    return (
                      <TableCell key={index} className="text-center">
                        <Badge
                          variant={isHighValue ? "default" : "secondary"}
                          className={
                            isHighValue ? "bg-green-100 text-green-800" : ""
                          }
                        >
                          ${value}
                        </Badge>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Monthly Cards Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Details Grid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {yearlyPlanData.details.map((detail) => (
              <div
                key={detail.month}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="text-sm font-medium text-gray-600 mb-2">
                  {MONTH_NAMES[detail.month - 1]}
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-green-600">
                    ${detail.sales_plan}
                  </div>
                  <div className="text-xs text-gray-500">Sales Plan</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Integration Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>API Integration Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              To integrate with your API:
            </p>
            <pre className="text-sm overflow-x-auto">
              {`// Replace the sample data fetch with actual API call:
const response = await fetch('\${BASE_URL}/api/yearly-plans/');
const data = await response.json();

// The response should match this structure:
{
  "id": 4,
  "user": 1,
  "year": 2025,
  "details": [
    {
      "month": 1,
      "sales_plan": "1000.00",
      "clients_plan": "50.00",
      "sales_count_plan": "200.00",
      // ... other fields
    }
    // ... 11 more months
  ]
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YearlyPlanApiExample;
