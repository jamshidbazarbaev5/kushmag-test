import {
  //   ShoppingBag,
  //   User2,
  //   List ,
  //   Ruler,
  Package,
  //   ArrowLeftRight,
  Menu,
  X,
  //   UserCheck,
  //   Receipt,
  //   PlusCircle,
  //   BanknoteIcon,
  LogOut,
  User,
  Calendar,
  Settings,
  DollarSign,
} from "lucide-react";
import { useGetMeasures } from "../api/measure";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../../components/LangugeSwitcher";
import { useLogout } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api from "../api/api";
// import { ThemeToggle } from "../components/ThemeToggle";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // const [isCollapsed, setIsCollapsed] = useState(false);
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
      const measures = Array.isArray(measuresData)
        ? measuresData
        : measuresData?.results || [];
      const newCount = measures.filter((m) => m.zamer_status === "new").length;
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
      api
        .get("items/currency/")
        .then((res) => {
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
        await api.patch(`items/currency/${currencyId}/`, {
          currency_rate: Number(currencyRate),
        });
      } else {
        await api.post("items/currency/", {
          currency_rate: Number(currencyRate),
        });
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
    // Navigation items are now in hamburger menu
  }, [location.pathname]);

  // navItems function removed as navigation is now in hamburger menu

  return (
    <div className="h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Mobile Header */}
      <header className="md:hidden shadow-sm px-4 py-2 flex items-center justify-between fixed top-0 left-0 right-0 z-50 bg-background border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-sidebar-foreground">KUSHMAG</div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {/* Mobile Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <User size={18} className="text-emerald-600" />
              </div>
            </button>

            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-[998]"
                  onClick={() => setDropdownOpen(false)}
                />
                {/* Dropdown Content */}
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border py-3 z-[999]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {currentUser && (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <User size={24} className="text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 text-lg">
                              {currentUser.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {currentUser.phone_number}
                            </div>
                            <div className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full mt-1">
                              {currentUser.role}
                            </div>
                          </div>
                        </div>
                        {newMeasuresCount > 0 &&
                          currentUser?.role !== "MANUFACTURE" && (
                            <div className="mt-3 p-2 bg-red-50 rounded-lg">
                              <div className="text-xs font-medium text-red-600 mb-1">
                                New Measures
                              </div>
                              <div className="text-sm font-medium text-red-800">
                                {newMeasuresCount} new measure
                                {newMeasuresCount !== 1 ? "s" : ""} available
                              </div>
                            </div>
                          )}
                      </div>
                      <div className="py-1">
                        {currentUser?.is_superuser && (
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDropdownOpen(false);
                              setCurrencyModalOpen(true);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer"
                            style={{ pointerEvents: "auto" }}
                          >
                            <Package size={16} className="text-gray-500" />
                            {t("currency.set")}
                          </button>
                        )}
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors cursor-pointer"
                          style={{ pointerEvents: "auto" }}
                        >
                          <LogOut size={16} className="text-red-500" />
                          {t("common.logout")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X size={24} className="text-gray-600" />
            ) : (
              <Menu size={24} className="text-gray-600" />
            )}
          </button>
        </div>
      </header>

      {/* Desktop Top Navigation Bar */}
      <nav className="hidden md:flex items-center justify-between px-6 py-4 shadow-sm border-b border-sidebar-border fixed top-0 left-0 right-0 bg-background z-50">
        <div className="flex items-center gap-6">
          <div className="font-semibold text-sidebar-foreground">KUSHMAG</div>

          {/* Desktop Main Navigation Items */}
          <div className="flex items-center gap-4">
            {/* Orders - for ADMIN, MANUFACTURE, PRODAVEC and OPERATOR */}
            {(currentUser?.role === "ADMIN" ||
              currentUser?.role === "MANUFACTURE" ||
              currentUser?.role === "PRODAVEC")
              && (
              <a
                href="/orders"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/orders");
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === "/orders"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground underline"
                    : "text-sidebar-foreground hover:bg-gray-50"
                }`}
              >
                <Package
                  size={16}
                  className={
                    location.pathname === "/orders"
                      ? "text-emerald-500"
                      : "text-gray-500"
                  }
                />
                <span className="font-medium">{t("navigation.orders")}</span>
              </a>
            )}

            {/* Measures - available for all roles except MANUFACTURE */}
            {currentUser?.role !== "MANUFACTURE" && (
              <a
                href="/measures"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/measures");
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === "/measures"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground underline"
                    : "text-sidebar-foreground hover:bg-gray-50"
                }`}
              >
                <Package
                  size={16}
                  className={
                    location.pathname === "/measures"
                      ? "text-emerald-500"
                      : "text-gray-500"
                  }
                />
                <span className="font-medium">{t("navigation.measures")}</span>
                {newMeasuresCount > 0 && (
                  <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
                    {newMeasuresCount}
                  </div>
                )}
              </a>
            )}
            {(currentUser?.role === "ZAMERSHIK" ||
              currentUser?.role === "PRODAVEC" ||
              currentUser?.role === "OPERATOR" ||
              currentUser?.role === "SOTRUDNIK" ||
              currentUser?.role === "MANUFACTURE") && (
              <a
                href="/salary-overview"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/salary-overview");
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === "/measures"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground underline"
                    : "text-sidebar-foreground hover:bg-gray-50"
                }`}
              >
                <Package
                  size={16}
                  className={
                    location.pathname === "/measures"
                      ? "text-emerald-500"
                      : "text-gray-500"
                  }
                />
                <span className="font-medium">
                  {t("navigation.sales_overview")}
                </span>
              </a>
            )}
            {(currentUser?.role === "ZAMERSHIK" ||
              currentUser?.role === "PRODAVEC" ||
              currentUser?.role === "OPERATOR" ||
              currentUser?.role === "SOTRUDNIK") && (
              <a
                href="/yearly-plans"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/yearly-plans");
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === "/yearly-plans"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground underline"
                    : "text-sidebar-foreground hover:bg-gray-50"
                }`}
              >
                <Package
                  size={16}
                  className={
                    location.pathname === "/yearly-plans"
                      ? "text-emerald-500"
                      : "text-gray-500"
                  }
                />
                <span className="font-medium">
                  {t("navigation.yearly_plans")}
                </span>
              </a>
            )}

            {/* Monthly Salaries - only for ADMIN */}
            {currentUser?.role === "ADMIN" && (
              <>
                <a
                  href="/monthly-salaries"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/monthly-salaries");
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === "/monthly-salaries"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground underline"
                      : "text-sidebar-foreground hover:bg-gray-50"
                  }`}
                >
                  <Package
                    size={16}
                    className={
                      location.pathname === "/monthly-salaries"
                        ? "text-emerald-500"
                        : "text-gray-500"
                    }
                  />
                  <span className="font-medium">
                    {t("navigation.monthly_salaries")}
                  </span>
                </a>
                <a
                  href="/yearly-plans"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/yearly-plans");
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === "/yearly-plans"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground underline"
                      : "text-sidebar-foreground hover:bg-gray-50"
                  }`}
                >
                  <Package
                    size={16}
                    className={
                      location.pathname === "/yearly-plans"
                        ? "text-emerald-500"
                        : "text-gray-500"
                    }
                  />
                  <span className="font-medium">
                    {t("navigation.yearly_plans")}
                  </span>
                </a>
              </>
            )}
          </div>

          {/* Desktop Settings Navigation */}
          <div className="flex items-center gap-4">
            {/* Settings dropdown for ADMIN users */}
            {currentUser?.role === "ADMIN" && (
              <>
                <a
                  href="/users"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/users");
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === "/users"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground underline"
                      : "text-sidebar-foreground hover:bg-gray-50"
                  }`}
                >
                  <User
                    size={16}
                    className={
                      location.pathname === "/users"
                        ? "text-emerald-500"
                        : "text-gray-500"
                    }
                  />
                  <span className="font-medium">{t("navigation.users")}</span>
                </a>
                {/* <a
                  href="/materials"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/materials");
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === "/materials"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground underline"
                      : "text-sidebar-foreground hover:bg-gray-50"
                  }`}
                >
                  <Package
                    size={16}
                    className={
                      location.pathname === "/materials"
                        ? "text-emerald-500"
                        : "text-gray-500"
                    }
                  />
                  <span className="font-medium">{t("navigation.material")}</span>
                </a> */}
                {/* <a
                  href="/price-settings"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/price-settings");
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === "/price-settings"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground underline"
                      : "text-sidebar-foreground hover:bg-gray-50"
                  }`}
                >
                  <DollarSign
                    size={16}
                    className={
                      location.pathname === "/price-settings"
                        ? "text-emerald-500"
                        : "text-gray-500"
                    }
                  />
                  <span className="font-medium">{t("navigation.price_settings")}</span>
                </a> */}
              </>
            )}

            {/* Settings button for unified settings page */}
            {currentUser?.role === "ADMIN" && (
              <button
                onClick={() => {
                  navigate("/settings");
                }}
                className={`px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                  location.pathname === "/settings"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600"
                }`}
              >
                <span className="font-medium">{t("navigation.settings")}</span>
                <Settings size={20} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {currentUser?.is_superuser && (
            <Dialog
              open={currencyModalOpen}
              onOpenChange={setCurrencyModalOpen}
            >
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
                  <DialogTitle>{t("currency.set")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCurrencySubmit} className="space-y-4">
                  <Input
                    type="number"
                    placeholder="12500"
                    value={currencyRate}
                    onChange={(e) => setCurrencyRate(e.target.value)}
                    required
                  />
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  {success && (
                    <div className="text-green-600 text-sm">
                      {t("Success!")}
                    </div>
                  )}
                  <DialogFooter>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? t("common.saving") : t("common.save")}
                    </button>
                    <DialogClose asChild>
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        {t("common.cancel")}
                      </button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <LanguageSwitcher />
          {/* Desktop Profile Icon - Hidden on mobile */}
          <div className="relative hidden md:block" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(false);
                setDropdownOpen(!dropdownOpen);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User size={18} className="text-emerald-600" />
                </div>
                {newMeasuresCount > 0 &&
                  currentUser?.role !== "MANUFACTURE" && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {newMeasuresCount}
                    </div>
                  )}
              </div>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border py-3 z-[9999]">
                {currentUser && (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User size={24} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 text-lg truncate">
                            {currentUser.username}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {currentUser.phone_number}
                          </div>
                          <div className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full mt-1">
                            {currentUser.role}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <LogOut size={16} className="text-red-500" />
                        <span className="font-medium">
                          {t("common.logout")}
                        </span>
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
        {/* Mobile menu overlay and sidebar */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed top-0 left-0 h-full w-80 bg-background border-r border-sidebar-border z-50 md:hidden">
              <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="font-semibold text-sidebar-foreground text-lg">
                    KUSHMAG
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mobile Navigation Items */}
                <nav className="flex-1 overflow-y-auto">
                  <div className="space-y-2">
                    {/* Orders - for ADMIN, MANUFACTURE, PRODAVEC and OPERATOR */}
                    {(currentUser?.role === "ADMIN" ||
                      currentUser?.role === "MANUFACTURE" ||
                      currentUser?.role === "PRODAVEC" ||
                      currentUser?.role === "OPERATOR") && (
                      <a
                        href="/orders"
                        onClick={(e) => {
                          e.preventDefault();
                          setMobileMenuOpen(false);
                          navigate("/orders");
                        }}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                          location.pathname === "/orders"
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-gray-50"
                        }`}
                      >
                        <Package
                          size={20}
                          className={
                            location.pathname === "/orders"
                              ? "text-emerald-500"
                              : "text-gray-500"
                          }
                        />
                        <span className="font-medium">
                          {t("navigation.orders")}
                        </span>
                      </a>
                    )}

                    {/* Settings submenu items - only for ADMIN */}
                    {currentUser?.role === "ADMIN" && (
                      <div className="border-b border-gray-200 pb-2 mb-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                          {t("navigation.settings")}
                        </div>

                        <a
                          href="/materials"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/materials");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/materials"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <Package
                            size={18}
                            className={
                              location.pathname === "/materials"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.material")}
                          </span>
                        </a>
                        <a
                          href="/material-types"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/material-types");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/material-types"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <Package
                            size={18}
                            className={
                              location.pathname === "/material-types"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.material_types")}
                          </span>
                        </a>
                        <a
                          href="/massifs"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/massifs");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/massifs"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <Package
                            size={18}
                            className={
                              location.pathname === "/massifs"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.massifs")}
                          </span>
                        </a>
                        <a
                          href="/colors"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/colors");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/colors"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <Package
                            size={18}
                            className={
                              location.pathname === "/colors"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.colors")}
                          </span>
                        </a>
                        <a
                          href="/patina-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/patina-colors");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/patina-colors"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <Package
                            size={18}
                            className={
                              location.pathname === "/patina-colors"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.patina_colors")}
                          </span>
                        </a>
                        <a
                          href="/beadings"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/beadings");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/beadings"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <Package
                            size={18}
                            className={
                              location.pathname === "/beadings"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.beadings")}
                          </span>
                        </a>
                        <a
                          href="/glass-types"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/glass-types");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/glass-types"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <Package
                            size={18}
                            className={
                              location.pathname === "/glass-types"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.glass_types")}
                          </span>
                        </a>
                        <a
                          href="/thresholds"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/thresholds");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/thresholds"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <Package
                            size={18}
                            className={
                              location.pathname === "/thresholds"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.thresholds")}
                          </span>
                        </a>
                        <a
                          href="/users"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/users");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/users"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <User
                            size={18}
                            className={
                              location.pathname === "/users"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.users")}
                          </span>
                        </a>
                        <a
                          href="/monthly-salaries"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/monthly-salaries");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/monthly-salaries"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <Package
                            size={18}
                            className={
                              location.pathname === "/monthly-salaries"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.monthly_salaries")}
                          </span>
                        </a>
                        <a
                          href="/attribute-settings"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/attribute-settings");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/attribute-settings"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <Package
                            size={18}
                            className={
                              location.pathname === "/attribute-settings"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.attribute_settings")}
                          </span>
                        </a>
                        <a
                          href="/casing-ranges"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/casing-ranges");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/casing-ranges"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <Package
                            size={18}
                            className={
                              location.pathname === "/casing-ranges"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.casing_ranges")}
                          </span>
                        </a>
                        <a
                          href="/price-settings"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/price-settings");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/price-settings"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <DollarSign
                            size={18}
                            className={
                              location.pathname === "/price-settings"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.price_settings")}
                          </span>
                        </a>

                        <a
                          href="/yearly-plans"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            navigate("/yearly-plans");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === "/yearly-plans"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-gray-50"
                          }`}
                        >
                          <Calendar
                            size={18}
                            className={
                              location.pathname === "/yearly-plans"
                                ? "text-emerald-500"
                                : "text-gray-500"
                            }
                          />
                          <span className="font-medium">
                            {t("navigation.yearly_plans")}
                          </span>
                        </a>
                      </div>
                    )}

                    {/* Measures - available for all roles except MANUFACTURE */}
                    {currentUser?.role !== "MANUFACTURE" && (
                      <a
                        href="/measures"
                        onClick={(e) => {
                          e.preventDefault();
                          setMobileMenuOpen(false);
                          navigate("/measures");
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          location.pathname === "/measures"
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-gray-50"
                        }`}
                      >
                        <Package
                          size={18}
                          className={
                            location.pathname === "/measures"
                              ? "text-emerald-500"
                              : "text-gray-500"
                          }
                        />
                        <span className="font-medium">
                          {t("navigation.measures")}
                        </span>
                        {newMeasuresCount > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-auto">
                            {newMeasuresCount}
                          </div>
                        )}
                      </a>
                    )}

                    {/* Salary Overview - for specific roles */}
                    {(currentUser?.role === "ZAMERSHIK" ||
                      currentUser?.role === "PRODAVEC" ||
                      currentUser?.role === "OPERATOR" ||
                      currentUser?.role === "SOTRUDNIK" ||
                      currentUser?.role === "MANUFACTURE") && (
                      <a
                        href="/salary-overview"
                        onClick={(e) => {
                          e.preventDefault();
                          setMobileMenuOpen(false);
                          navigate("/salary-overview");
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          location.pathname === "/salary-overview"
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-gray-50"
                        }`}
                      >
                        <Package
                          size={18}
                          className={
                            location.pathname === "/salary-overview"
                              ? "text-emerald-500"
                              : "text-gray-500"
                          }
                        />
                        <span className="font-medium">
                          {t("navigation.sales_overview")}
                        </span>
                      </a>
                    )}

                    {/* Language Switcher - hidden for MANUFACTURE */}
                    {currentUser?.role !== "MANUFACTURE" && (
                      <div className="px-3 py-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          {t("common.language")}
                        </div>
                        <LanguageSwitcher />
                      </div>
                    )}

                    {/* Profile Section */}
                    {currentUser && (
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="px-3 py-3">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <User size={20} className="text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800 truncate">
                                {currentUser.username}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {currentUser.phone_number}
                              </div>
                              <div className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full mt-1">
                                {currentUser.role}
                              </div>
                            </div>
                          </div>

                          {currentUser?.is_superuser && (
                            <button
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setCurrencyModalOpen(true);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors mb-2"
                            >
                              <Package size={16} className="text-gray-500" />
                              <span>{t("currency.set")}</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setMobileMenuOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={16} className="text-red-500" />
                            <span>{t("common.logout")}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </nav>
              </div>
            </div>
          </>
        )}

        <main className="flex-1 min-w-0 transition-all duration-300 overflow-x-auto pt-16 md:pt-0">
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
