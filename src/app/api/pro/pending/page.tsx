export default function ProPendingPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-8 text-center">
        <div className="mb-4 text-6xl">⏳</div>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          Application Under Review
        </h1>
        <p className="mb-4 text-gray-700">
          Thank you for applying for a professional account on MyHomeDox!
        </p>
        <p className="text-gray-600">
          We&apos;re reviewing your application and will send you an email once your account is approved.
          This typically takes 1-2 business days.
        </p>

        <div className="mt-8 border-t border-yellow-300 pt-8">
          <p className="mb-4 text-sm text-gray-600">
            Questions about your application?
          </p>
          <a
            href="mailto:support@myhomedox.com"
            className="text-blue-600 hover:underline"
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}