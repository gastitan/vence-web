import { RuleForm } from '@/components/RuleForm'
import { DueTimeline } from '@/components/DueTimeline'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] py-6">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Dueflow
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Due-date calculation
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-medium text-white">Rule form</h2>
        <RuleForm />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-medium text-white">
          Upcoming (next 6 months)
        </h2>
        <DueTimeline />
      </section>
    </Layout>
  )
}
