import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { DashboardPage } from '@/app/dashboard/DashboardPage'
import { CalendarPage } from '@/app/calendar/CalendarPage'
import { AccountsPage } from '@/app/accounts/AccountsPage'
import { BillsPage } from '@/app/bills/BillsPage'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

