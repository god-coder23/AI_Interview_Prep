import Form from './Form'
import {React} from "react"

const Navbar = () => {
  return (
    <div className="min-h-screen bg-[#f4f8f1] text-slate-900">
      <header className="px-5 pt-5 sm:px-8 lg:px-12 lg:pt-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/70 bg-white/80 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Smart Practice
            </p>
            <h1 className="text-xl font-semibold sm:text-2xl">
              Interview <span className="text-emerald-600">AI</span>
            </h1>
          </div>

          <button
            type="button"
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition duration-200 hover:bg-slate-800"
          >
            Get Started
          </button>
        </div>
      </header>

      <Form />
    </div>
  )
}

export default Navbar
