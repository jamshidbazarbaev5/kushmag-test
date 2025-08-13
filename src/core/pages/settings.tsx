// import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  User,
  Palette,
  Settings as SettingsIcon,
  Layers,
  Droplets,
  Square,
  Eye,
  Minus,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  // const [activeTab, setActiveTab] = useState('orders');

  const settingsTabs: SettingsTab[] = [
    {
      id: 'orders',
      label: t('navigation.orders'),
      icon: <Package size={20} />,
      path: '/orders',
      adminOnly: true
    },
    {
      id: 'measures',
      label: t('navigation.measures'),
      icon: <Package size={20} />,
      path: '/measures'
    },
    {
      id: 'monthly-salaries',
      label: t('navigation.monthly_salaries'),
      icon: <DollarSign size={20} />,
      path: '/monthly-salaries',
      adminOnly: true
    },
    {
      id: 'salary-overview',
      label: t('navigation.sales_overview'),
      icon: <BarChart3 size={20} />,
      path: '/salary-overview'
    },
    {
      id: 'yearly-plans',
      label: t('navigation.yearly_plans'),
      icon: <Calendar size={20} />,
      path: '/yearly-plans'
    },
    {
      id: 'materials',
      label: t('navigation.material'),
      icon: <Package size={20} />,
      path: '/materials',
      adminOnly: true
    },
    {
      id: 'material-types',
      label: t('navigation.material_types'),
      icon: <Package size={20} />,
      path: '/material-types',
      adminOnly: true
    },
    {
      id: 'massifs',
      label: t('navigation.massifs'),
      icon: <Package size={20} />,
      path: '/massifs',
      adminOnly: true
    },
    {
      id: 'colors',
      label: t('navigation.colors'),
      icon: <Palette size={20} />,
      path: '/colors',
      adminOnly: true
    },
    {
      id: 'patina-colors',
      label: t('navigation.patina_colors'),
      icon: <Droplets size={20} />,
      path: '/patina-colors',
      adminOnly: true
    },
    {
      id: 'beadings',
      label: t('navigation.beadings'),
      icon: <Square size={20} />,
      path: '/beadings',
      adminOnly: true
    },
    {
      id: 'glass-types',
      label: t('navigation.glass_types'),
      icon: <Eye size={20} />,
      path: '/glass-types',
      adminOnly: true
    },
    {
      id: 'thresholds',
      label: t('navigation.thresholds'),
      icon: <Minus size={20} />,
      path: '/thresholds',
      adminOnly: true
    },
    {
      id: 'users',
      label: t('navigation.users'),
      icon: <User size={20} />,
      path: '/users',
      adminOnly: true
    },
    {
      id: 'attribute-settings',
      label: t('navigation.attribute_settings'),
      icon: <SettingsIcon size={20} />,
      path: '/attribute-settings'
    },
    {
      id: 'casing-ranges',
      label: t('navigation.casing_ranges'),
      icon: <Layers size={20} />,
      path: '/casing-ranges',
      adminOnly: true
    }
  ];

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  const getFilteredTabs = () => {
    if (currentUser?.role === "ADMIN") {
      return settingsTabs;
    }
    return settingsTabs.filter(tab => !tab.adminOnly);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('navigation.settings')}
        </h1>
        <p className="text-gray-600">
          {t('settings.description')}
        </p>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden md:block">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex flex-wrap gap-4">
            {getFilteredTabs().map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={`flex items-center gap-2 py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                  location.pathname === tab.path
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - Show current page info */}
        <div className="grid grid-cols-1 gap-6">
          {getFilteredTabs()
            .filter(tab => location.pathname === tab.path)
            .map((tab) => (
              <div
                key={tab.path}
                className="p-8 bg-emerald-50 rounded-lg border border-emerald-500"
              >
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-lg bg-emerald-100 text-emerald-600">
                    {tab.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{tab.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t(`settings.descriptions.${tab.path.substring(1)}`)}
                    </p>
                    <p className="text-sm text-emerald-600 mt-2 font-medium">
                      Currently viewing this page
                    </p>
                  </div>
                </div>
              </div>
            ))}

          {/* Show message if no current page matches */}
          {!getFilteredTabs().some(tab => location.pathname === tab.path) && (
            <div className="p-8 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {t('navigation.settings')}
              </h3>
              <p className="text-gray-500">
                Click on any tab above to navigate to that section
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile View - Simple List */}
      <div className="md:hidden space-y-2">
        {getFilteredTabs().map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.path)}
            className={`w-full flex items-center gap-3 p-4 rounded-lg transition-colors text-left ${
              location.pathname === tab.path
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
          >
            {tab.icon}
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
