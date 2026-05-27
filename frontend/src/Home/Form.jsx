import { useEffect, useState, React } from 'react'
import heroImage from '../assets/hero.png'
import Interview from '../Interview/Interview'

const ACTIVE_SESSION_KEY = 'ai-interview-active-session'

const Form = () => {
  const [isClicked, setIsClicked] = useState(false)
  const [skills, setSkills] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [isNext, setIsNext] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [interviewData, setInterviewData] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      const sessionId = window.localStorage.getItem(ACTIVE_SESSION_KEY)

      if (!sessionId) {
        setIsRestoringSession(false)
        return
      }

      try {
        const response = await fetch(`http://localhost:3000/api/interview/session/${sessionId}`)
        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to restore interview session')
        }

        setInterviewData(data)
        setIsNext(true)
      } catch (error) {
        console.log('Error while restoring session', error)
        window.localStorage.removeItem(ACTIVE_SESSION_KEY)
      } finally {
        setIsRestoringSession(false)
      }
    }

    restoreSession()
  }, [])

  const handleButtonClick = async () => {
    if (isPreparing) return

    setIsPreparing(true)
    setIsClicked(true)

    setTimeout(() => {
      setIsClicked(false)
    }, 120)

    try{
      console.log("Button Cliked")
      const fetchData = await fetch("http://localhost:3000/api/interview/generate",{
        method: "POST",
        headers: {
        "Content-Type": "application/json",
      },
        body: JSON.stringify({
          "resume" : skills,
          "jd" : jobDescription
        })
      })
      const data = await fetchData.json()

      if (!fetchData.ok || !data.success) {
        throw new Error(data.message || "Failed to generate interview")
      }

      setInterviewData(data)
      window.localStorage.setItem(ACTIVE_SESSION_KEY, data.sessionId)
      setIsNext(true)
    }
    catch(err){
      console.log("Error while generating questions",err)
    }
    finally {
      setIsPreparing(false)
    }
  }

  const handleSessionChange = (data) => {
    setInterviewData(data)

    if (data?.sessionId) {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, data.sessionId)
    }
  }

  return (
    <section className="relative overflow-hidden px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      {isRestoringSession && (
        <div className="mx-auto flex min-h-[78vh] w-full max-w-6xl items-center justify-center">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[36px] border border-slate-200/80 bg-white/90 px-8 py-14 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.10),_transparent_28%)]" />
            <div className="relative">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald-200/80 bg-emerald-50 shadow-[0_20px_40px_rgba(16,185,129,0.10)]">
                <div className="h-14 w-14 rounded-full border-[6px] border-emerald-100 border-t-emerald-500 animate-spin" />
              </div>
              <h2 className="mt-8 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Restoring your interview session.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                We&apos;re reconnecting you to your saved progress so you can continue where you left off.
              </p>
            </div>
          </div>
        </div>
      )}
      {isPreparing && !isNext && (
        <div className="mx-auto flex min-h-[78vh] w-full max-w-6xl items-center justify-center">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[36px] border border-emerald-100/80 bg-[linear-gradient(160deg,_rgba(248,255,250,0.97)_0%,_rgba(226,247,233,0.95)_52%,_rgba(203,236,217,0.92)_100%)] px-8 py-14 text-center shadow-[0_32px_90px_rgba(16,185,129,0.16)] backdrop-blur-xl sm:px-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_28%)]" />
            <div className="absolute left-10 top-10 h-24 w-24 rounded-full bg-white/50 blur-2xl" />
            <div className="absolute bottom-8 right-12 h-28 w-28 rounded-full bg-emerald-200/60 blur-3xl" />

            <div className="relative">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald-200/80 bg-white/70 shadow-[0_20px_40px_rgba(16,185,129,0.12)]">
                <div className="h-14 w-14 rounded-full border-[6px] border-emerald-100 border-t-emerald-500 animate-spin" />
              </div>

              <div className="mx-auto mt-8 max-w-2xl space-y-4">
                <span className="inline-flex rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Preparing Interview
                </span>
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                  Your first question is being prepared.
                </h2>
                <p className="text-sm leading-7 text-slate-600 sm:text-base">
                  We&apos;re turning your skills and job description into a focused mock interview so the conversation starts with the right context.
                </p>
              </div>

              <div className="mx-auto mt-10 grid max-w-2xl gap-4 text-left sm:grid-cols-3">
                <div className="rounded-2xl border border-white/80 bg-white/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Reading</p>
                  <p className="mt-2 text-sm text-slate-600">Understanding your stack and target role.</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Framing</p>
                  <p className="mt-2 text-sm text-slate-600">Shaping questions that feel more like a real interview.</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Starting</p>
                  <p className="mt-2 text-sm text-slate-600">Loading your first prompt and voice response.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {!isRestoringSession && !isNext && <div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#f8fff8_0%,_#f3f7f3_100%)]" />

      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-emerald-100/70 bg-[linear-gradient(160deg,_#f4fff7_0%,_#dff6e7_44%,_#c7ebd9_100%)] px-7 py-8 text-slate-900 shadow-[0_30px_80px_rgba(92,128,108,0.20)] sm:px-10 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.85),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_26%)]" />
          <div className="absolute -right-12 top-10 h-40 w-40 rounded-full bg-white/35 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-emerald-200/45 blur-3xl" />

          <div className="relative space-y-6">
            <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 shadow-sm backdrop-blur-sm">
              Interview Prep Studio
            </span>

            <div className="space-y-5">
              <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Turn your experience into a focused AI mock interview.
              </h1>
              <div className="h-1 w-24 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent" />
              <p className="max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
                Add your skills and the role you are targeting. We'll help frame a sharper,
                more realistic interview setup before you begin.
              </p>
            </div>
          </div>

          <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/55 p-4 shadow-[0_14px_30px_rgba(148,163,184,0.12)] backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Tailored</p>
              <p className="mt-2 text-sm text-slate-700">Questions aligned to your role and stack.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/55 p-4 shadow-[0_14px_30px_rgba(148,163,184,0.12)] backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Practical</p>
              <p className="mt-2 text-sm text-slate-700">Designed for real interview scenarios, not trivia.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/55 p-4 shadow-[0_14px_30px_rgba(148,163,184,0.12)] backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Confident</p>
              <p className="mt-2 text-sm text-slate-700">A cleaner start so you can focus on your answers.</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/88 shadow-[0_24px_70px_rgba(148,163,184,0.22)] backdrop-blur-xl">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-slate-200/70 blur-3xl" />

          <div className="relative border-b border-slate-200/80 px-6 py-5 sm:px-8">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-600">
              Interview Setup
            </p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Build your session</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Fill in a few details to personalize the conversation.
                </p>
              </div>
              <img
                src={"https://imgs.search.brave.com/1oDQXFWAgjAoSFlVJ7Nijwe9I9Joy6n-0RGBtAA9ug8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/c3ZncmVwby5jb20v/c2hvdy8zNzU1Mjcv/YWktcGxhdGZvcm0u/c3Zn"}
                alt="Interview assistant illustration"
                className="hidden h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200 sm:block"
              />
            </div>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
            <label className="block space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-800">Core skills</span>
                <span className="text-xs font-medium text-slate-400">{skills.length} characters</span>
              </div>
              <textarea
                value={skills}
                onChange={(event) => setSkills(event.target.value)}
                placeholder="React, Node.js, system design, REST APIs, SQL..."
                className="min-h-32 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm leading-6 text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
              <p className="text-sm text-slate-500">
                Include the tools, languages, and strengths you want the interview to probe.
              </p>
            </label>

            <label className="block space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-800">Job description</span>
                <span className="text-xs font-medium text-slate-400">
                  {jobDescription.length} characters
                </span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the role summary, key requirements, responsibilities, or hiring expectations..."
                className="min-h-40 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm leading-6 text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
              <p className="text-sm text-slate-500">
                The more context you provide here, the more specific the interview can feel.
              </p>
            </label>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900">
              Tip: paste the exact role description for stronger technical and behavioral prompts.
            </div>

            <button
              type="button"
              disabled={isPreparing}
              className={`w-full rounded-3xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition duration-150 hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70 ${isClicked ? 'scale-[0.98]' : ''}`}
              onClick={handleButtonClick}
            >
              {isPreparing ? 'Preparing your interview...' : 'Start your interview'}
            </button>
          </div>
        </div>
      </div>
        </div>}
      {isNext && <Interview interviewData={interviewData} onSessionChange={handleSessionChange} />}
    </section>
  )
}

export default Form
