import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Star,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  Zap,
  Flame,
} from "lucide-react";

interface PerformanceIndicatorProps {
  percentage: number;
  variant?: "default" | "compact" | "detailed" | "gauge";
  showTrend?: boolean;
  showIcon?: boolean;
  showProgressBar?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface PerformanceRatingProps {
  percentage: number;
  maxStars?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

interface PerformanceGaugeProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
}

interface PerformanceTierProps {
  percentage: number;
  showLabel?: boolean;
  variant?: "badge" | "card" | "minimal";
}

// Performance tier definitions
export const getPerformanceTier = (percentage: number) => {
  if (percentage >= 120) {
    return {
      tier: "exceptional",
      label: "Exceptional",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-gradient-to-r from-purple-100 to-pink-100",
      textColor: "text-purple-700",
      icon: Award,
      badge: "destructive" as const,
    };
  } else if (percentage >= 100) {
    return {
      tier: "excellent",
      label: "Excellent",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-gradient-to-r from-green-100 to-emerald-100",
      textColor: "text-green-700",
      icon: CheckCircle,
      badge: "default" as const,
    };
  } else if (percentage >= 85) {
    return {
      tier: "good",
      label: "Good",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-r from-blue-100 to-cyan-100",
      textColor: "text-blue-700",
      icon: Target,
      badge: "secondary" as const,
    };
  } else if (percentage >= 70) {
    return {
      tier: "fair",
      label: "Fair",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-gradient-to-r from-yellow-100 to-orange-100",
      textColor: "text-yellow-700",
      icon: AlertTriangle,
      badge: "outline" as const,
    };
  } else {
    return {
      tier: "poor",
      label: "Needs Improvement",
      color: "from-red-500 to-pink-500",
      bgColor: "bg-gradient-to-r from-red-100 to-pink-100",
      textColor: "text-red-700",
      icon: XCircle,
      badge: "destructive" as const,
    };
  }
};

// Main Performance Indicator Component
export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({
  percentage,
  variant = "default",
  showTrend = true,
  showIcon = true,
  showProgressBar = false,
  size = "md",
  className,
}) => {
  const tier = getPerformanceTier(percentage);
  const Icon = tier.icon;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {showIcon && <Icon className="w-3 h-3" />}
        <Badge variant={tier.badge} className={sizeClasses[size]}>
          {percentage.toFixed(1)}%
        </Badge>
        {showTrend &&
          (percentage >= 100 ? (
            <TrendingUp className="w-3 h-3 text-green-600" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-600" />
          ))}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-lg",
          tier.bgColor,
          className,
        )}
      >
        <div className="flex items-center gap-1">
          {showIcon && <Icon className={cn("w-4 h-4", tier.textColor)} />}
          <span
            className={cn("font-semibold", tier.textColor, sizeClasses[size])}
          >
            {percentage.toFixed(1)}%
          </span>
        </div>
        <span className={cn("text-xs", tier.textColor, "opacity-80")}>
          {tier.label}
        </span>
        {showProgressBar && (
          <Progress value={Math.min(percentage, 100)} className="w-full h-1" />
        )}
      </div>
    );
  }

  if (variant === "gauge") {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <PerformanceGauge percentage={percentage} />
        <span className={cn("text-xs mt-1", tier.textColor)}>{tier.label}</span>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon && <Icon className={cn("w-4 h-4", tier.textColor)} />}
      <Badge variant={tier.badge} className={sizeClasses[size]}>
        {percentage.toFixed(1)}%
      </Badge>
      {showProgressBar && (
        <Progress value={Math.min(percentage, 100)} className="w-16 h-2" />
      )}
      {showTrend &&
        (percentage >= 100 ? (
          <TrendingUp className="w-4 h-4 text-green-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-600" />
        ))}
    </div>
  );
};

// Star Rating Component
export const PerformanceRating: React.FC<PerformanceRatingProps> = ({
  percentage,
  maxStars = 5,
  showLabel = true,
  size = "md",
}) => {
  const rating = Math.min(Math.round((percentage / 100) * maxStars), maxStars);
  const tier = getPerformanceTier(percentage);

  const starSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: maxStars }, (_, i) => (
          <Star
            key={i}
            className={cn(
              starSizes[size],
              i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn("text-xs ml-1", tier.textColor)}>
          {percentage.toFixed(1)}%
        </span>
      )}
    </div>
  );
};

// Circular Gauge Component
export const PerformanceGauge: React.FC<PerformanceGaugeProps> = ({
  percentage,
  size = 60,
  strokeWidth = 6,
  showValue = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (Math.min(percentage, 100) / 100) * circumference;
  const tier = getPerformanceTier(percentage);

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={tier.textColor}
          style={{
            transition: "stroke-dashoffset 0.5s ease-in-out",
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-xs font-semibold", tier.textColor)}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Performance Tier Badge Component
export const PerformanceTier: React.FC<PerformanceTierProps> = ({
  percentage,
  showLabel = true,
  variant = "badge",
}) => {
  const tier = getPerformanceTier(percentage);
  const Icon = tier.icon;

  if (variant === "card") {
    return (
      <div className={cn("p-3 rounded-lg border", tier.bgColor)}>
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5", tier.textColor)} />
          <div>
            <div className={cn("font-semibold", tier.textColor)}>
              {percentage.toFixed(1)}%
            </div>
            {showLabel && (
              <div className={cn("text-xs", tier.textColor, "opacity-80")}>
                {tier.label}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-1">
        <Icon className={cn("w-4 h-4", tier.textColor)} />
        <span className={cn("text-sm font-medium", tier.textColor)}>
          {percentage.toFixed(1)}%
        </span>
      </div>
    );
  }

  // Default badge variant
  return (
    <Badge variant={tier.badge} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {percentage.toFixed(1)}%
      {showLabel && <span className="ml-1 opacity-80">{tier.label}</span>}
    </Badge>
  );
};

// Animated Performance Indicator
export const AnimatedPerformanceIndicator: React.FC<{
  percentage: number;
  className?: string;
}> = ({ percentage, className }) => {
  const tier = getPerformanceTier(percentage);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg p-3",
        tier.bgColor,
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1 rounded-full", tier.bgColor)}>
            {percentage >= 120 ? (
              <Flame className={cn("w-4 h-4", tier.textColor)} />
            ) : percentage >= 100 ? (
              <Zap className={cn("w-4 h-4", tier.textColor)} />
            ) : (
              <Target className={cn("w-4 h-4", tier.textColor)} />
            )}
          </div>
          <div>
            <div className={cn("font-bold text-lg", tier.textColor)}>
              {percentage.toFixed(1)}%
            </div>
            <div className={cn("text-xs", tier.textColor, "opacity-80")}>
              {tier.label}
            </div>
          </div>
        </div>
        <PerformanceGauge percentage={percentage} size={40} strokeWidth={4} />
      </div>

      {/* Animated background gradient */}
      <div
        className={cn(
          "absolute inset-0 opacity-10",
          `bg-gradient-to-r ${tier.color}`,
          "animate-pulse",
        )}
      />
    </div>
  );
};

// Heat Map Cell Component for Table
export const HeatMapCell: React.FC<{
  value: number;
  maxValue: number;
  showValue?: boolean;
  className?: string;
}> = ({ value, maxValue, showValue = true, className }) => {
  const intensity = maxValue > 0 ? value / maxValue : 0;

  return (
    <div
      className={cn(
        "relative p-2 rounded text-center transition-all duration-200 hover:scale-105",
        className,
      )}
      style={{
        backgroundColor: `rgba(59, 130, 246, ${intensity * 0.6})`,
      }}
    >
      {showValue && (
        <span
          className={cn(
            "font-medium",
            intensity > 0.5 ? "text-white" : "text-gray-900",
          )}
        >
          {value.toLocaleString()}
        </span>
      )}
    </div>
  );
};

export default PerformanceIndicator;
