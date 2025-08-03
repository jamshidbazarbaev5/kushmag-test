import {
//   ShoppingBag,
//   User2,
//   List ,
//   Ruler,
  Package,
//   ArrowLeftRight,
  // Menu,
  // X,
//   UserCheck,
//   Receipt,
//   PlusCircle,
//   BanknoteIcon,
  LogOut,
  User,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useGetMeasures } from "../api/measure";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from '../../components/LangugeSwitcher';
import { useLogout } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api from "../api/api";
// import { ThemeToggle } from "../components/ThemeToggle";

type NavItem = {
  icon: LucideIcon;
  label: string;
  href?: string;
  id?: string;
  submenu?: NavItem[];
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [currencyRate, setCurrencyRate] = useState("");
  const [currencyId, setCurrencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [newMeasuresCount, setNewMeasuresCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: measuresData } = useGetMeasures();

  useEffect(() => {
    if (measuresData) {
      const measures = Array.isArray(measuresData) ? measuresData : measuresData?.results || [];
      const newCount = measures.filter(m => m.zamer_status === 'new').length;
      setNewMeasuresCount(newCount);
    }
  }, [measuresData]);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { mutate: logout } = useLogout();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch current currency rate when modal opens
  useEffect(() => {
    if (currencyModalOpen) {
      setLoading(true);
      setError("");
      setSuccess(false);
      api.get("items/currency/")
        .then(res => {
          const results = res.data.results || [];
          if (Array.isArray(results) && results.length > 0) {
            // Only keep the integer part of the currency rate
            const rate = results[0].currency_rate;
            setCurrencyRate(rate ? String(Math.trunc(Number(rate))) : "");
            setCurrencyId(results[0].id?.toString() || null);
          } else {
            setCurrencyRate("");
            setCurrencyId(null);
          }
        })
        .catch(() => {
          setError("Failed to fetch currency rate");
        })
        .finally(() => setLoading(false));
    }
  }, [currencyModalOpen]);

  const handleCurrencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      if (currencyId) {
        await api.patch(`items/currency/${currencyId}/`, { currency_rate: Number(currencyRate) });
      } else {
        await api.post("items/currency/", { currency_rate: Number(currencyRate) });
      }
      setSuccess(true);
      setTimeout(() => setCurrencyModalOpen(false), 1000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Error");
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Set active submenu based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    navItems.forEach((item: NavItem) => {
      if (
        item.id &&
        item.submenu &&
        item.submenu.some((subItem) => subItem.href === currentPath)
      ) {
        setActiveSubmenu(item.id);
      }
    });
  }, [location.pathname]);

  const navItems:any = (() => {
    const role = currentUser?.role;
    
    // Admin has access to everything
    if (role === "ADMIN") {
      return [
        {
          icon: Package,
          label: t("navigation.orders"),
          href: "/orders",
        },
        {
          icon: Package,
          label: t("navigation.settings"),
          id: "settings",
          submenu: [
          {
            icon: Package,
            label: t("navigation.material"),
            href: "/materials",
          },
          {
            icon: Package,
            label: t("navigation.material_types"),
            href: "/material-types",
          },
          {
            icon: Package,
            label: t("navigation.massifs"),
            href: "/massifs",
          },
          {
            icon: Package,
            label: t("navigation.colors"),
            href: "/colors",
          },
          {
            icon: Package,
            label: t("navigation.patina_colors"),
            href: "/patina-colors",
          },
          {
            icon: Package,
            label: t("navigation.beadings"),
            href: "/beadings",
          },
          {
            icon: Package,
            label: t("navigation.glass_types"),
            href: "/glass-types",
          },
          {
            icon: Package,
            label: t("navigation.thresholds"),
            href: "/thresholds",
          },
          {
            icon: User,
            label: t("navigation.users"),
            href: "/users",
          },
          {
            icon: Package,
            label: t("navigation.measures"),
            href: "/measures",
          },
          {
            icon: Package,
            label: t("navigation.attribute_settings"),
            href: "/attribute-settings",
          },
          {
            icon: Package,
            label: t("navigation.casing_ranges"),
            href: "/casing-ranges",
          }
        ],
      }];
    }

    // All other roles only see measures
    return [{
      icon: Package,
      label: t("navigation.settings"),
      id: "settings",
      submenu: [
        {
          icon: Package,
          label: t("navigation.measures"),
          href: "/measures",
        }
      ],
    }];

    // // Add money to budget - only for superuser
    // if (currentUser?.is_superuser) {
    //   baseItems.push({
    //     icon: PlusCircle,
    //     label: t("navigation.add_money"),
    //     href: "/finance",
    //   });
    // }

    // // Settings section - not for "Администратор" and customized for "Продавец"
    // if (currentUser?.role === "Продавец") {
    //   return [
    //     {
    //       icon: Package,
    //       label: t("navigation.dashobard"),
    //       href: "/dashboard",
    //     },
    //     { icon: ShoppingBag, label: t("navigation.sale"), href: "/sales" },
    //     {
    //       icon: Package,
    //       label: t("navigation.stock_balance"),
    //       href: "/product-stock-balance",
    //     },
    //     { icon: UserCheck, label: t("navigation.clients"), href: "/clients" },
    //     { icon: ShoppingBag, label: t("navigation.debt"), href: "/debts" },
    //   ];
    // }

    // // Add settings section for all roles except "Администратор"
    // if (currentUser?.role !== "Администратор") {
    //   baseItems.push({
    //     icon: Package,
    //     label: t("navigation.settings"),
    //     id: "settings",
    //     submenu: [
    //       {
    //         icon: ShoppingBag,
    //         label: t("navigation.stores"),
    //         href: "/stores",
    //       },
    //       {
    //         icon: ListView,
    //         label: t("navigation.categories"),
    //         href: "/categories",
    //       },
    //       {
    //         icon: Ruler,
    //         label: t("navigation.measurements"),
    //         href: "/measurements",
    //       },
    //       {
    //         icon: ShoppingBag,
    //         label: t("navigation.products"),
    //         href: "/products",
    //       },
          
    //       {
    //         icon: ListView,
    //         label: t("navigation.suppliers"),
    //         href: "/suppliers",
    //       },
    //       {
    //         icon: Receipt,
    //         label: t("navigation.cash_inflow_names"),
    //         href: "/cash-inflow-names",
    //       },
    //       {
    //         icon: Receipt,
    //         label: t("navigation.expense_name"),
    //         href: "/expense-name",
    //       },
    //       { icon: User2, label: t("navigation.users"), href: "/users" },
    //       {
    //         icon: User2,
    //         label: t("navigation.sponsors"),
    //         href: "/sponsors",
    //       },
         
    //     ],
    //   });
    // }

  })();

  return (
    <div className="h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Mobile Header (unchanged) */}
      <header className="md:hidden shadow-sm px-4 py-2 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
        {/* ...existing code... */}
      </header>

      {/* Desktop Top Navigation Bar */}
      <nav className="hidden md:flex items-center justify-between px-6 py-4 shadow-sm border-b border-sidebar-border fixed top-0 left-0 right-0 bg-background z-50">
        <div className="flex items-center gap-4">
          <div className="font-semibold text-sidebar-foreground">KUSHMAG</div>
          {navItems.map((item:any, index:number) => (
            <div key={index} className="relative">
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => {
                      if (item.id) {
                        setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
                        setDropdownOpen(false);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeSubmenu === item.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
                  >
                    <item.icon size={20} className={activeSubmenu === item.id ? "text-emerald-500" : "text-gray-500"} />
                    <span className="font-medium">{item.label}</span>
                    <ChevronDown size={16} className={`ml-1 text-gray-500 transition-transform ${activeSubmenu === item.id ? "rotate-180" : ""}`} />
                  </button>
                  {activeSubmenu === item.id && (
                    <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border py-2 min-w-[220px] z-50">
                      {item.submenu.map((subItem:any, subIndex:number) => (
                        <a
                          key={subIndex}
                          href={subItem.href}
                          onClick={e => {
                            e.preventDefault();
                            setActiveSubmenu(null);
                            setDropdownOpen(false);
                            if (subItem.href) navigate(subItem.href);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-left transition-colors ${location.pathname === subItem.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
                        >
                          <subItem.icon size={18} className={location.pathname === subItem.href ? "text-emerald-500" : "text-gray-500"} />
                          <span className="font-medium">{subItem.label}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <a
                  href={item.href}
                  onClick={e => {
                    e.preventDefault();
                    setActiveSubmenu(null);
                    setDropdownOpen(false);
                    if (item.href) navigate(item.href);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${location.pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}
                >
                  <item.icon size={20} className={location.pathname === item.href ? "text-emerald-500" : "text-gray-500"} />
                  <span className="font-medium">{item.label}</span>
                </a>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {currentUser?.is_superuser && (
            <Dialog open={currencyModalOpen} onOpenChange={setCurrencyModalOpen}>
              <DialogTrigger asChild>
                <button
                  className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition mr-2"
                  onClick={() => setCurrencyModalOpen(true)}
                >
                  {t("currency.set")}
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('currency.set')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCurrencySubmit} className="space-y-4">
                  <Input
                    type="number"
                    placeholder="12500"
                    value={currencyRate}
                    onChange={e => setCurrencyRate(e.target.value)}
                    required
                  />
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  {success && <div className="text-green-600 text-sm">{t("Success!")}</div>}
                  <DialogFooter>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? t("common.saving") : t("common.save")}
                    </button>
                    <DialogClose asChild>
                      <button type="button" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                        {t("common.cancel")}
                      </button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <LanguageSwitcher />
          {/* Desktop Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={e => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User size={18} className="text-emerald-600" />
                </div>
                {newMeasuresCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newMeasuresCount}
                  </div>
                )}
              </div>
              <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border py-3 z-[9999]" style={{ zIndex: 9999 }}>
                {currentUser && (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User size={24} className="text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 text-lg">{currentUser.username}</div>
                          <div className="text-sm text-gray-500">{currentUser.phone_number}</div>
                          <div className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full mt-1">{currentUser.role}</div>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <LogOut size={16} className="text-red-500" />
                        <span className="font-medium">{t("common.logout")}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-0 md:pt-[72px]">
        {/* Mobile menu overlay (unchanged) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}
        <main className="flex-1 min-w-0 transition-all duration-300 overflow-x-auto ">
          <div className="h-full flex flex-col min-w-[320px]">
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <div className="max-w-[1920px] mx-auto">{children}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}