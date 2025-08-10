import React from "react";
import EditableConsolidatedSalesPlanTable from "./EditableConsolidatedSalesPlanTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Sample data structure for demonstration
const sampleUsers = [
  { id: 1, full_name: "John Smith" },
  { id: 2, full_name: "Jane Doe" },
  { id: 3, full_name: "Mike Johnson" },
];

const sampleYearlyPlans = [
  {
    id: 1,
    user: 1,
    year: 2025,
    details: [
      {
        month: 1,
        sales_plan: "1000.00",
        clients_plan: "50.00",
        sales_count_plan: "200.00",
        sales: 800,
        clients: 45,
        sales_count: 180,
        sales_percentage: 80.0,
        clients_percentage: 90.0,
        sales_count_percentage: 90.0,
      },
      {
        month: 2,
        sales_plan: "1200.00",
        clients_plan: "55.00",
        sales_count_plan: "210.00",
        sales: 1100,
        clients: 52,
        sales_count: 205,
        sales_percentage: 91.7,
        clients_percentage: 94.5,
        sales_count_percentage: 97.6,
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
      // Continue for remaining months...
      ...Array.from({ length: 9 }, (_, index) => ({
        month: index + 4,
        sales_plan: (1400 + index * 100).toString() + ".00",
        clients_plan: (65 + index * 5).toString() + ".00",
        sales_count_plan: (230 + index * 10).toString() + ".00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0,
      })),
    ],
  },
  {
    id: 2,
    user: 2,
    year: 2025,
    details: Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      sales_plan: (800 + index * 50).toString() + ".00",
      clients_plan: (40 + index * 3).toString() + ".00",
      sales_count_plan: (150 + index * 8).toString() + ".00",
      sales: 0,
      clients: 0,
      sales_count: 0,
      sales_percentage: 0.0,
      clients_percentage: 0.0,
      sales_count_percentage: 0.0,
    })),
  },
];

const YearlyPlansDemo: React.FC = () => {
  const getUserName = (userId: number) => {
    const user = sampleUsers.find((u) => u.id === userId);
    return user ? user.full_name : `User ${userId}`;
  };

  const handleCreatePlan = (newPlan: any) => {
    console.log("Creating new plan:", newPlan);
    // In real implementation, this would call your API
    alert(
      `New plan created for ${getUserName(newPlan.user)} for year ${newPlan.year}`,
    );
  };

  const handleUpdatePlan = (planId: number, updatedDetails: any) => {
    console.log("Updating plan:", planId, updatedDetails);
    // In real implementation, this would call your API
    alert(`Plan ${planId} updated successfully`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Yearly Plans Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This demo shows the enhanced yearly plans table with modal
            functionality. Try clicking the "Add User Plan" button to create a
            new plan (starts with empty fields), or click the edit button
            (pencil icon) on existing plans to modify them.
          </p>

          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Features Demonstrated:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Modal-based plan creation and editing</li>
              <li>Empty fields for new plans (fill with your data)</li>
              <li>Real-time total calculations</li>
              <li>User selection with availability checking</li>
              <li>Responsive table design</li>
              <li>Multi-language support (i18n)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <EditableConsolidatedSalesPlanTable
        data={sampleYearlyPlans}
        getUserName={getUserName}
        year={2025}
        onUpdatePlan={handleUpdatePlan}
        onCreatePlan={handleCreatePlan}
        users={sampleUsers}
      />

      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Adding a New Plan:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
              <li>Click the "Add User Plan" button</li>
              <li>Select a user from the dropdown</li>
              <li>Modify the year if needed</li>
              <li>
                Edit the monthly values for sales, clients, and sales count
                plans
              </li>
              <li>Review the totals at the bottom</li>
              <li>Click "Create" to save</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold">Editing an Existing Plan:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
              <li>Click the edit button (pencil icon) in the actions column</li>
              <li>Modify any monthly values as needed</li>
              <li>Check the updated totals</li>
              <li>Click "Save" to apply changes</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-3 rounded">
            <h4 className="font-semibold text-yellow-800">
              Sample Data Structure:
            </h4>
            <pre className="text-xs mt-2 overflow-x-auto">
              {`// For creating new plans (starts with empty fields):
{
  "user": 1,
  "year": 2025,
  "details": [
    {
      "month": 1,
      "sales_plan": 0,
      "clients_plan": 0,
      "sales_count_plan": 0
    }
    // ... for all 12 months with zero values
  ]
}
// For editing existing plans (includes actuals):
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
      "sales": 800,
      "clients": 45,
      "sales_count": 180,
      "sales_percentage": 80.0,
      "clients_percentage": 90.0,
      "sales_count_percentage": 90.0
    }
    // ... for all 12 months
  ]
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YearlyPlansDemo;
