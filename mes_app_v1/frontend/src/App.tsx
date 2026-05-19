import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import RecipeList from "./pages/technologist/RecipeList";
import RecipeForm from "./pages/technologist/RecipeForm";
import AdminUsers from "./pages/admin/AdminUsers";
import BatchList from "./pages/foreman/BatchList";
import BatchForm from "./pages/foreman/BatchForm";

function TechnologistRoutes({ workshop }: { workshop?: string }) {
  const prefix = workshop ? `/${workshop}/technologist` : "/technologist";
  return (
    <Routes>
      <Route path="recipes" element={<RecipeList />} />
      <Route path="recipes/new" element={<RecipeForm mode="create" />} />
      <Route path="recipes/:id/edit" element={<RecipeForm mode="edit" />} />
      <Route path="recipes/:id/new-version" element={<RecipeForm mode="new-version" />} />
      <Route path="dashboard" element={<div className="text-center py-8">Панель технолога</div>} />
      <Route path="*" element={<Navigate to={`${prefix}/recipes`} replace />} />
    </Routes>
  );
}

function ForemanRoutes({ workshop }: { workshop?: string }) {
  const prefix = workshop ? `/${workshop}/foreman` : "/foreman";
  return (
    <Routes>
      <Route path="batches" element={<BatchList />} />
      <Route path="batches/new" element={<BatchForm />} />
      <Route path="dashboard" element={<div className="text-center py-8">Панель бригадира</div>} />
      <Route path="*" element={<Navigate to={`${prefix}/batches`} replace />} />
    </Routes>
  );
}

function MasterRoutes({ workshop }: { workshop?: string }) {
  const prefix = workshop ? `/${workshop}/master` : "/master";
  return (
    <Routes>
      <Route path="dashboard" element={<div className="text-center py-8">Панель мастера цеха</div>} />
      <Route path="batches" element={<BatchList />} />
      <Route path="recipes" element={<RecipeList />} />
      <Route path="*" element={<Navigate to={`${prefix}/dashboard`} replace />} />
    </Routes>
  );
}

function BoilerRoutes({ workshop }: { workshop?: string }) {
  const prefix = workshop ? `/${workshop}/boiler` : "/boiler";
  return (
    <Routes>
      <Route path="dashboard" element={<div className="text-center py-8">Панель варщика</div>} />
      <Route path="batches" element={<BatchList />} />
      <Route path="*" element={<Navigate to={`${prefix}/batches`} replace />} />
    </Routes>
  );
}

function MachineRoutes({ workshop }: { workshop?: string }) {
  const prefix = workshop ? `/${workshop}/machine` : "/machine";
  return (
    <Routes>
      <Route path="dashboard" element={<div className="text-center py-8">Панель оператора</div>} />
      <Route path="batches" element={<BatchList />} />
      <Route path="*" element={<Navigate to={`${prefix}/dashboard`} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/admin/*" element={
          <RequireAuth>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<div className="text-center py-8">Панель администратора</div>} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<div className="text-center py-8">Настройки</div>} />
                <Route path="recipes" element={<RecipeList />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/technologist/*" element={
          <RequireAuth>
            <DashboardLayout>
              <TechnologistRoutes />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/mzhk/technologist/*" element={
          <RequireAuth>
            <DashboardLayout>
              <TechnologistRoutes workshop="mzhk" />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/tzhk/technologist/*" element={
          <RequireAuth>
            <DashboardLayout>
              <TechnologistRoutes workshop="tzhk" />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/foreman/*" element={
          <RequireAuth>
            <DashboardLayout>
              <ForemanRoutes />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/mzhk/foreman/*" element={
          <RequireAuth>
            <DashboardLayout>
              <ForemanRoutes workshop="mzhk" />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/tzhk/foreman/*" element={
          <RequireAuth>
            <DashboardLayout>
              <ForemanRoutes workshop="tzhk" />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/master/*" element={
          <RequireAuth>
            <DashboardLayout>
              <MasterRoutes />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/mzhk/master/*" element={
          <RequireAuth>
            <DashboardLayout>
              <MasterRoutes workshop="mzhk" />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/tzhk/master/*" element={
          <RequireAuth>
            <DashboardLayout>
              <MasterRoutes workshop="tzhk" />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/boiler/*" element={
          <RequireAuth>
            <DashboardLayout>
              <BoilerRoutes />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/mzhk/boiler/*" element={
          <RequireAuth>
            <DashboardLayout>
              <BoilerRoutes workshop="mzhk" />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/tzhk/boiler/*" element={
          <RequireAuth>
            <DashboardLayout>
              <BoilerRoutes workshop="tzhk" />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/machine/*" element={
          <RequireAuth>
            <DashboardLayout>
              <MachineRoutes />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/mzhk/machine/*" element={
          <RequireAuth>
            <DashboardLayout>
              <MachineRoutes workshop="mzhk" />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/tzhk/machine/*" element={
          <RequireAuth>
            <DashboardLayout>
              <MachineRoutes workshop="tzhk" />
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/home" element={
          <RequireAuth>
            <DashboardLayout>
              <div className="text-center py-8">Главная</div>
            </DashboardLayout>
          </RequireAuth>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
