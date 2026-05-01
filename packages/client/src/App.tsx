import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.js';
import HomePage from './pages/HomePage.js';
import TransactionsPage from './pages/TransactionsPage.js';
import ImportPage from './pages/ImportPage.js';
import CategoriesPage from './pages/CategoriesPage.js';
import TagsPage from './pages/TagsPage.js';
import RulesPage from './pages/RulesPage.js';
import StatsPage from './pages/StatsPage.js';
import TaxPage from './pages/TaxPage.js';
import AccountsPage from './pages/AccountsPage.js';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/tax" element={<TaxPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Route>
    </Routes>
  );
}
