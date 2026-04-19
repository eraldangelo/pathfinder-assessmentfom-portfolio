import AssessmentWizard from '../components/assessment/AssessmentWizard';

export default function Page() {
  return (
    <main className="min-h-screen px-4 py-6 sm:py-[2vh] bg-transparent">
      <div className="mx-auto w-full max-w-xl relative assessment-shell">
        <AssessmentWizard />
      </div>

      <footer className="left-0 right-0 mt-4 pb-2 sm:mt-0 sm:pb-0 sm:fixed sm:bottom-[1vh] flex justify-center">
        <div className="text-center text-xs text-slate-400 px-2">
          This form collects your email and phone number in accordance with applicable privacy laws.
        </div>
      </footer>
    </main>
  );
}

