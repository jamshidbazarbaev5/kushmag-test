import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./core/context/AuthContext";
import { LoginPage } from "./core/pages/login";
import { Outlet, Route, Routes } from "react-router-dom";
import Layout from "./core/Layout/layout";
import MaterialsPage from "./core/pages/material";
import CreateMaterialPage from "./core/pages/create-material";
import MaterialTypesPage from "./core/pages/material-type";
import CreateMaterialTypePage from "./core/pages/create-material-type";
import MassifsPage from "./core/pages/massif";
import CreateMassifPage from "./core/pages/create-massif";
import ColorsPage from "./core/pages/color";
import CreateColorPage from "./core/pages/create-color";
import PatinaColorsPage from "./core/pages/patina-color";
import CreatePatinaColorPage from "./core/pages/create-patina-color";
import BeadingsPage from "./core/pages/beading";
import CreateBeadingPage from "./core/pages/create-beading";
import GlassTypesPage from "./core/pages/glass-type";
import CreateGlassTypePage from "./core/pages/create-glass-type";
import ThresholdsPage from "./core/pages/threshold";
import CreateThresholdPage from "./core/pages/create-threshold";
// import { Users } from "lucide-react";
import UsersPage from "./core/pages/users";
import CreateUserPage from "./core/pages/create-user";
import CreateMeasurePage from "./core/pages/create-measure";
import MeasuresPage from "./core/pages/measures";
import EditMeasurePage from "./core/pages/edit-measure";
import AttributeSettingsPage from "./core/pages/attribute-settings";
import CreateCasingRangePage from "./core/pages/create-casing-range";
import CasingRangesPage from "./core/pages/casing-ranges";
import OrdersPage from "./core/pages/orders";
import CreateOrderPage from "./core/pages/create-order";
import EditOrderPage from "./core/pages/edit-order";

const queryClient = new QueryClient();
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          
          <Route path="/login" element={<LoginPage />} />
             <Route element={<Layout><Outlet /></Layout>}>
             
             <Route path="/" element={<div>Home Page</div>} />
                 <Route path="/materials" element={<MaterialsPage />} />
                 <Route path="/create-material" element={<CreateMaterialPage />} />
                 
                 <Route path="/material-types" element={<MaterialTypesPage />} />
                 <Route path="/create-material-type" element={<CreateMaterialTypePage />} />
                 
                 <Route path="/massifs" element={<MassifsPage />} />
                 <Route path="/create-massif" element={<CreateMassifPage />} />
                 
                 <Route path="/orders" element={<OrdersPage />} />
                 <Route path="/orders/create" element={<CreateOrderPage />} />
                 <Route path="/orders/create-from-measure/:measureId" element={<EditOrderPage />} />
                 
                 <Route path="/colors" element={<ColorsPage />} />
                 <Route path="/create-color" element={<CreateColorPage />} />
                 
                 <Route path="/patina-colors" element={<PatinaColorsPage />} />
                 <Route path="/create-patina-color" element={<CreatePatinaColorPage />} />
                 
                 <Route path="/beadings" element={<BeadingsPage />} />
                 <Route path="/create-beading" element={<CreateBeadingPage />} />
                 
                 <Route path="/glass-types" element={<GlassTypesPage />} />
                 <Route path="/create-glass-type" element={<CreateGlassTypePage />} />
                 
                 <Route path="/thresholds" element={<ThresholdsPage />} />
                 <Route path="/create-threshold" element={<CreateThresholdPage />} />

                  <Route path="/users" element={<UsersPage />} />
                 <Route path="/create-user" element={<CreateUserPage />} />
                  
                  {/* Measures routes */}
                  <Route path="/measures" element={<MeasuresPage />} />
                  <Route path="/measures/create" element={<CreateMeasurePage />} />
                  <Route path="/measures/:id/edit" element={<EditMeasurePage />} />
                  
                  <Route path="/attribute-settings" element={<AttributeSettingsPage />} />

                  <Route path="/casing-ranges" element={<CasingRangesPage />} />
                  <Route path="/create-casing-range" element={<CreateCasingRangePage />} /> 

               </Route>
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
