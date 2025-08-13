import { useState } from 'react';
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
  DollarSign
} from 'lucide-react';

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: SettingsItem[];
}

interface SettingsItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('materials');

  const settingsTabs: SettingsTab[] = [
    {
      id: 'materials',
      label: t('settings.tabs.materials'),
      icon: <Package size={20} />,
      items: [
        {
          path: '/materials',
          label: t('navigation.material'),
          icon: <Package size={18} />,
          adminOnly: true
        },
        {
          path: '/material-types',
          label: t('navigation.material_types'),
          icon: <Package size={18} />,
          adminOnly: true
        },
        {
          path: '/massifs',
          label: t('navigation.massifs'),
          icon: <Package size={18} />,
          adminOnly: true
        }
      ]
    },
    {
      id: 'appearance',
      label: t('settings.tabs.appearance'),
      icon: <Palette size={20} />,
      items: [
        {
          path: '/colors',
          label: t('navigation.colors'),
          icon: <Palette size={18} />,
          adminOnly: true
        },
        {
          path: '/patina-colors',
          label: t('navigation.patina_colors'),
          icon: <Droplets size={18} />,
          adminOnly: true
        },
        {
          path: '/beadings',
          label: t('navigation.beadings'),
          icon: <Square size={18} />,
          adminOnly: true
        },
        {
          path: '/glass-types',
          label: t('navigation.glass_types'),
          icon: <Eye size={18} />,
          adminOnly: true
        },
        {
          path: '/thresholds',
          label: t('navigation.thresholds'),
          icon: <Minus size={18} />,
          adminOnly: true
        }
      ]
    },
    {
      id: 'users',
      label: t('settings.tabs.users'),
      icon: <User size={20} />,
      items: [
        {
          path: '/users',
          label: t('navigation.users'),
          icon: <User size={18} />,
          adminOnly: true
        },
        {
          path: '/monthly-salaries',
          label: t('navigation.monthly_salaries'),
          icon: <DollarSign size={18} />,
          adminOnly: true
        }
      ]
    },
    {
      id: 'system',
      label: t('settings.tabs.system'),
      icon: <SettingsIcon size={20} />,
      items: [
        {
          path: '/attribute-settings',
          label: t('navigation.attribute_settings'),
          icon: <SettingsIcon size={18} />
        },
        {
          path: '/casing-ranges',
          label: t('navigation.casing_ranges'),
          icon: <Layers size={18} />,
          adminOnly: true
        }
      ]
    }
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  const getFilteredItems = (items: SettingsItem[]) => {
    if (currentUser?.role === "ADMIN") {
      return items;
    }
    return items.filter(item => !item.adminOnly);
  };

  const getFilteredTabs = () => {
    return settingsTabs.filter(tab => {
      const filteredItems = getFilteredItems(tab.items);
      return filteredItems.length > 0;
    });
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
          <nav className="-mb-px flex space-x-8">
            {getFilteredTabs().map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
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

        {/* Tab Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredTabs()
            .find(tab => tab.id === activeTab)
            ?.items.filter(item => currentUser?.role === "ADMIN" || !item.adminOnly)
            .map((item) => (
              <div
                key={item.path}
                onClick={() => handleItemClick(item.path)}
                className={`p-6 bg-white rounded-lg border cursor-pointer transition-all hover:shadow-lg hover:border-emerald-200 ${
                  location.pathname === item.path
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    location.pathname === item.path
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t(`settings.descriptions.${item.path.substring(1)}`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Mobile View - Simple List */}
      <div className="md:hidden space-y-4">
        {getFilteredTabs().map((tab) => (
          <div key={tab.id} className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {tab.icon}
                <h2 className="font-semibold text-gray-900">{tab.label}</h2>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {getFilteredItems(tab.items).map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    location.pathname === item.path
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
