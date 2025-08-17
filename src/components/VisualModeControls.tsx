import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Grid3X3,
  Gauge,
  LayoutDashboard,
  Eye,
  Target,
  TrendingUp,
  Activity
} from "lucide-react";

interface VisualModeControlsProps {
  viewMode: "planned" | "actual" | "comparison";
  visualMode: "standard" | "heatmap" | "performance" | "dashboard";
  onViewModeChange: (mode: "planned" | "actual" | "comparison") => void;
  onVisualModeChange: (mode: "standard" | "heatmap" | "performance" | "dashboard") => void;
  className?: string;
}

const VisualModeControls: React.FC<VisualModeControlsProps> = ({
  viewMode,
  visualMode,
  onViewModeChange,
  onVisualModeChange,
  className = "",
}) => {
  const viewModes = [
    {
      value: "planned" as const,
      label: "Planned Values",
      icon: Target,
      description: "Show planned targets",
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    },
    {
      value: "actual" as const,
      label: "Actual Values",
      icon: Activity,
      description: "Show actual results",
      color: "bg-green-100 text-green-700 hover:bg-green-200",
    },
    {
      value: "comparison" as const,
      label: "Comparison",
      icon: TrendingUp,
      description: "Compare planned vs actual",
      color: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    },
  ];

  const visualModes = [
    {
      value: "standard" as const,
      label: "Standard",
      icon: Eye,
      description: "Traditional table view",
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    },
    {
      value: "performance" as const,
      label: "Performance",
      icon: Gauge,
      description: "Enhanced with performance indicators",
      color: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    },
    {
      value: "heatmap" as const,
      label: "Heat Map",
      icon: Grid3X3,
      description: "Color-coded intensity visualization",
      color: "bg-red-100 text-red-700 hover:bg-red-200",
    },
    {
      value: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Card-based dashboard layout",
      color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* View Mode Controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Data View:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.value;

            return (
              <Button
                key={mode.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onViewModeChange(mode.value)}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  isActive
                    ? "shadow-md"
                    : `${mode.color} border-transparent`
                }`}
                title={mode.description}
              >
                <Icon className="w-4 h-4" />
                {mode.label}
                {isActive && (
                  <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                    Active
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Visual Mode Controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Visual Style:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {visualModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = visualMode === mode.value;

            return (
              <Button
                key={mode.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onVisualModeChange(mode.value)}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  isActive
                    ? "shadow-md"
                    : `${mode.color} border-transparent`
                }`}
                title={mode.description}
              >
                <Icon className="w-4 h-4" />
                {mode.label}
                {isActive && (
                  <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                    Active
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Mode Descriptions */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-1 bg-blue-500 rounded">
            {viewModes.find(m => m.value === viewMode)?.icon &&
              React.createElement(viewModes.find(m => m.value === viewMode)!.icon, {
                className: "w-3 h-3 text-white"
              })
            }
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-900">
              {viewModes.find(m => m.value === viewMode)?.label} + {" "}
              {visualModes.find(m => m.value === visualMode)?.label}
            </div>
            <div className="text-xs text-blue-700 mt-1">
              {viewModes.find(m => m.value === viewMode)?.description} with {" "}
              {visualModes.find(m => m.value === visualMode)?.description.toLowerCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      {visualMode === "performance" && (
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Performance View Features:</span>
          </div>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• Star ratings for quick performance assessment</li>
            <li>• Circular gauges showing completion percentages</li>
            <li>• Color-coded performance tiers (Excellent, Good, Fair, Poor)</li>
            <li>• Interactive trend indicators</li>
          </ul>
        </div>
      )}

      {visualMode === "heatmap" && (
        <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <Grid3X3 className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Heat Map Features:</span>
          </div>
          <ul className="text-xs text-red-700 space-y-1">
            <li>• Color intensity represents value magnitude</li>
            <li>• Darker colors indicate higher values</li>
            <li>• Hover for detailed information</li>
            <li>• Quick visual pattern recognition</li>
          </ul>
        </div>
      )}

      {visualMode === "dashboard" && (
        <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800">Dashboard Features:</span>
          </div>
          <ul className="text-xs text-indigo-700 space-y-1">
            <li>• Card-based layout for better readability</li>
            <li>• Individual performance metrics per user</li>
            <li>• Monthly achievement heat map</li>
            <li>• Comprehensive performance overview</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VisualModeControls;
